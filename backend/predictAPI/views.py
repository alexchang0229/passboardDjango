from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from skyfield.sgp4lib import EarthSatellite
from .models import user_setting, TLE_db
from datetime import datetime, timedelta
from skyfield.api import load, wgs84
import pytz
import numpy as np
import requests
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User


def make_sats_from_id(idList):
    satellites = []
    makeSatError = False
    ts = load.timescale()
    for SatID in idList:
        try:
            TLE = TLE_db.objects.get(id_number=SatID)
            satname = TLE.name
            satellite = EarthSatellite(TLE.line1, TLE.line2, satname, ts)
            satellites.append(satellite)
            days = load.timescale().now() - satellite.epoch
            if abs(days) > 3:  # if TLEs > 3 days old, get new ones
                raise
        except:
            try:
                # Get new TLEs from Celestrak
                url = 'https://celestrak.com/satcat/tle.php?CATNR={}'.format(
                    SatID)
                response = requests.get(url)
                TLE = response.content.decode('utf-8').splitlines()
                satname = TLE[0]
                satID = TLE[2].split()[1]
                # Update database with new TLEs
                TLE_db.objects.update_or_create(
                    id_number=satID, defaults={'name': satname, 'line1': TLE[1], 'line2': TLE[2], 'id_number': satID})
                satellite = EarthSatellite(satname, TLE[2], TLE[0], ts)
                satellites.append(satellite)
            except Exception as e:
                makeSatError = SatID
                print(e)
    return satellites, makeSatError


def predict(settings):
    satList = settings['satList']
    stationLong = float(settings['stationLong'])
    stationLat = float(settings['stationLat'])
    predHours = float(settings['predHours'])
    minAltitudeDegrees = float(settings['minElevation'])
    stationLocation = wgs84.latlon(stationLat, stationLong)
    predictionType = settings['predictionType']
    customStartTime = datetime.strptime(settings['customStartTime'],
                                        "%Y-%m-%dT%H:%M:%S.%fZ")
    idList = [satList[ind]['NORADid'] for ind in satList]
    satellites, _ = make_sats_from_id(idList)
    # Timescale range for predicting satellite passes
    ts = load.timescale()
    if predictionType == 'realtime':
        t0 = ts.utc(ts.now().utc_datetime() -
                    timedelta(seconds=30))  # Time range starts 30s before now
    else:
        t0 = ts.utc(customStartTime.replace(tzinfo=pytz.utc))
    t1 = ts.utc(t0.utc_datetime() + timedelta(hours=predHours))
    passes = {}

    # This for loop goes through each satellite and finds passes over the
    # station, passe information for all satellites are stored in the 'passes' array
    passIndex = 0

    for i, satloop in enumerate(satList):
        t_temp, events_temp = satellites[i].find_events(
            stationLocation, t0, t1, altitude_degrees=minAltitudeDegrees)
        # find event returns [0: AOS, 1: PEAK, 2: LOS, 0: AOS ... ]
        t_AOSLOS = np.delete(t_temp, np.where(events_temp == 1))

        # If we call find_events() during a pass, it's going to return an array
        # starting with event 1 or 2 (PEAK/LOS) instead of 0 (AOS). To find the
        # AOS time in the past, this if statement goes back one day and finds the
        # closest AOS time to the current time and puts that as the first element
        # of the t_AOSLOS array
        if events_temp[0] != 0:
            t_temp1, events_temp1 = satellites[i].find_events(
                stationLocation,
                ts.utc(t0.utc_datetime() - timedelta(hours=24)),
                t0,
                altitude_degrees=minAltitudeDegrees)
            aosArray = np.delete(
                t_temp1,
                np.append(np.where(events_temp1 == 1),
                          np.where(events_temp1 == 2)))
            passAOS = min(aosArray, key=lambda x: abs(x - t0))
            t_AOSLOS = [passAOS] + t_AOSLOS.tolist()

        t_AOS = t_AOSLOS[0:][::2]
        t_LOS = t_AOSLOS[1:][::2]
        orbitatEpoch = satellites[i].model.revnum
        angVel = satellites[i].model.no_kozai
        for j, _ in enumerate(t_LOS):
            minSinceEpoch = (
                datetime.timestamp(t_AOS[j].utc_datetime()) -
                datetime.timestamp(satellites[i].epoch.utc_datetime())) / 60
            orbitsSinceEpoch = np.floor(minSinceEpoch * angVel / (2 * np.pi))
            orbitnum = orbitatEpoch + orbitsSinceEpoch

            passes[passIndex] = {
                'start':
                datetime.timestamp(t_AOS[j].utc_datetime()),
                'end':
                datetime.timestamp(t_LOS[j].utc_datetime()),
                'duration': (t_LOS[j].utc_datetime() -
                             t_AOS[j].utc_datetime()).total_seconds(),
                'satName':
                satellites[i].name,
                'NORADid':
                satList[satloop]['NORADid'],
                'priority':
                satList[satloop]['priority'],
                'satIND':
                i,
                'orbitnum':
                orbitnum,
                'take':
                True
            }
            passIndex = passIndex + 1

    minSecBetweenPass = 0
    # Sort passes by AOS time
    passSortKeys = sorted(passes, key=lambda x: passes.get(x).get('start'))
    passesSorted = []
    for i in passSortKeys:
        passesSorted.append(passes[i])
    # Handles conflicts based on priority
    for i in range(0, len(passesSorted)):
        if passesSorted[i]['take'] == True:
            for j in range(i + 1, len(passesSorted)):
                if passesSorted[i]['end'] + minSecBetweenPass > passesSorted[
                        j]['start']:
                    if passesSorted[i]['priority'] < passesSorted[j][
                            'priority']:
                        passesSorted[i]['take'] = True
                        passesSorted[j]['take'] = False
                    else:
                        passesSorted[i]['take'] = False
                        passesSorted[j]['take'] = True
                        break
                else:
                    passesSorted[i]['take'] = True
                    break

    return passesSorted


def calc_map_coords(passesSorted, passIndex, username, session):
    try:
        settings = session['setting']
    except:
        try:
            settings = user_setting.objects.get(
                username=username).custom_settings
        except:
            settings = user_setting.objects.get(
                username='default').custom_settings
    stationCoord = [
        float(settings['stationLong']),
        float(settings['stationLat'])
    ]
    selected_pass = passesSorted[passIndex]
    satellite, _ = make_sats_from_id([selected_pass['NORADid']])
    ts = load.timescale()
    AOStime = ts.from_datetime(
        datetime.utcfromtimestamp(
            selected_pass['start']).replace(tzinfo=pytz.timezone('UTC')))
    LOStime = ts.from_datetime(
        datetime.utcfromtimestamp(
            selected_pass['end']).replace(tzinfo=pytz.timezone('UTC')))
    AOSpos = wgs84.subpoint(satellite[0].at(AOStime))
    LOSpos = wgs84.subpoint(satellite[0].at(LOStime))
    AOScoord = [
        round(AOSpos.longitude.degrees, 2),
        round(AOSpos.latitude.degrees, 2)
    ]
    LOScoord = [
        round(LOSpos.longitude.degrees, 2),
        round(LOSpos.latitude.degrees, 2)
    ]
    return AOScoord, LOScoord, stationCoord


def calc_path(passesSorted, passIndex, username, session):
    try:
        settings = session['setting']
    except:
        try:
            settings = user_setting.objects.get(
                username=username).custom_settings
        except:
            settings = user_setting.objects.get(
                username='default').custom_settings
    stationLong = float(settings['stationLong'])
    stationLat = float(settings['stationLat'])
    stationLocation = wgs84.latlon(stationLat, stationLong)
    selected_pass = passesSorted[passIndex]
    satellite, _ = make_sats_from_id([selected_pass['NORADid']])
    passTimeArray = np.arange(selected_pass['start'], selected_pass['end'], 1)
    difference = satellite[0] - stationLocation
    ELAZ = []
    ts = load.timescale()
    for t in passTimeArray:
        timeStep = datetime.utcfromtimestamp(t).replace(tzinfo=pytz.utc)
        _el, _az, _ = difference.at(ts.from_datetime(timeStep)).altaz()
        _eldeg = _el.degrees
        ELAZ.append([t, _eldeg, _az.degrees])
    return ELAZ


class DiscardSession(APIView):
    def get(self, request):
        try:
            del request.session['setting']
        except:
            pass
        return Response(status=status.HTTP_200_OK)


class saveToSession(APIView):
    def post(self, request):
        newSettings = request.data
        print(newSettings)
        idList = [newSettings['satList'][sats]['NORADid']
                  for sats in request.data['satList']]
        satellites, makeSatError = make_sats_from_id(idList)

        if makeSatError is False:
            satList = {}
            for i in range(satellites.__len__()):
                satList[i] = {
                    'name': satellites[i].name,
                    'NORADid': idList[i],
                    'priority': i
                }
            newSettings['satList'] = satList
            request.session['setting'] = request.data
            return Response(data={'Settings saved to session.'}, status=status.HTTP_200_OK)
        else:
            errorString = 'NORAD ID: {ErrorID} caused an error, settings not saved.'
            return Response(data=errorString.format(ErrorID=makeSatError), status=status.HTTP_400_BAD_REQUEST)


class map_view_info(APIView):
    def post(self, request):
        passOrbitNum = request.data
        passsorted = np.array(request.session['passesSorted'])
        orbitList = [aos['orbitnum'] for aos in passsorted]
        passIndex = orbitList.index(passOrbitNum)
        aosCoord, losCoord, stationCoord = calc_map_coords(
            passsorted, passIndex, request.user.username, request.session)
        mapinfo = [aosCoord, losCoord, stationCoord]
        return Response(data=mapinfo, status=status.HTTP_200_OK)


class passData_to_react(APIView):
    def get(self, request):
        try:
            try:
                settings = request.session['setting']
            except:
                try:
                    settings = user_setting.objects.get(
                        username=request.user.username).custom_settings
                except:
                    settings = user_setting.objects.get(
                        username='default').custom_settings
            passesSorted = predict(settings)
            request.session['passesSorted'] = passesSorted

            return Response(data=passesSorted, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(data=e, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class settings_to_react(APIView):
    def get(self, request):
        try:
            settings = request.session['setting']
        except:
            try:
                settings = user_setting.objects.get(
                    username=request.user.username).custom_settings
            except:
                settings = user_setting.objects.get(
                    username='default').custom_settings
        return Response(data=settings, status=status.HTTP_200_OK)

    def post(self, request):
        newSettings = request.data
        idList = [newSettings['satList'][sats]['NORADid']
                  for sats in request.data['satList']]
        satellites, makeSatError = make_sats_from_id(idList)
        if makeSatError is False:
            satList = {}
            for i in range(satellites.__len__()):
                satList[i] = {
                    'name': satellites[i].name,
                    'NORADid': idList[i],
                    'priority': i
                }
            newSettings['satList'] = satList
            request.session['setting'] = request.data
            user_setting.objects.update_or_create(
                username=request.user.username, defaults={'custom_settings': request.data})
            return Response(data={'Saved settings to database.'}, status=status.HTTP_200_OK)
        else:
            errorString = 'NORAD ID: {ErrorID} caused an error, settings not saved.'
            return Response(data=errorString.format(ErrorID=makeSatError), status=status.HTTP_400_BAD_REQUEST)


class path_CSV_to_react(APIView):
    def post(self, request):
        passAOS = request.data
        passesSorted = np.array(request.session['passesSorted'])
        aosList = [aos['start'] for aos in passesSorted]
        passIndex = aosList.index(passAOS)
        path = calc_path(
            request.session['passesSorted'], passIndex, request.user.username, request.session)
        return Response(data=path, status=status.HTTP_200_OK)


class user_authentication(APIView):
    def post(self, request):
        username = request.data['username']
        password = request.data['password']

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            request.session['username'] = user.username
            return Response(status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_401_UNAUTHORIZED)


class register_new_user(APIView):
    def post(self, request):
        if User.objects.filter(
                username=request.data['username']).exists():
            return Response(status=status.HTTP_200_OK)
        else:
            User.objects.create_user(
                username=request.data['username'], email=request.data['email'], password=request.data['password'])
            return Response(status=status.HTTP_201_CREATED)


class userInfo(APIView):
    def get(self, request):
        try:
            user = request.session['username']
            return Response(data=user, status=status.HTTP_200_OK)
        except:
            return Response(status=status.HTTP_204_NO_CONTENT)


class logOut(APIView):
    def get(self, request):
        logout(request)
        return Response(status=status.HTTP_200_OK)
