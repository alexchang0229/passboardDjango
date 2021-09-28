from django.db import models
from datetime import datetime
# Create your models here.


def default_settings():
    return {'stationLong': -73.43, 'stationLat': 45.51,
            'predHours': 24.0, 'predictionType': 'realtime',
            'customStartTime': datetime.strftime(datetime.now(), "%Y-%m-%dT%H:%M:%S.%fZ"),
            'minElevation': 5.0,
            'satList': {0: {'name': 'NOAA 15', 'NORADid': 25338, 'priority': 0},
                        1: {'name': 'NOAA 18', 'NORADid': 28654, 'priority': 1},
                        2: {'name': 'NOAA 19', 'NORADid': 33591, 'priority': 2},
                        3: {'name': 'METOP-B', 'NORADid': 38771, 'priority': 3},
                        4: {'name': 'METOP-C', 'NORADid': 43689, 'priority': 4},
                        5: {'name': 'FENGYUN 3B', 'NORADid': 37214, 'priority': 5}}
            }


class user_setting(models.Model):
    custom_settings = models.JSONField(default=default_settings)
    username = models.CharField(default='username', max_length=30)

    def __str__(self):
        return self.username


class TLE_db(models.Model):
    name = models.CharField(default='satellite_name', max_length=80)
    line1 = models.CharField(default='', max_length=80)
    line2 = models.CharField(default='', max_length=80)
    id_number = models.CharField(default='', max_length=80)

    def __str__(self):
        return self.name
