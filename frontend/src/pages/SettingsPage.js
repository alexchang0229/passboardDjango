import React, { useEffect, useState } from "react";
import TextField from '@material-ui/core/TextField';
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Box, Paper, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import Table from '../functions/table.js'
import HelpIcon from '@material-ui/icons/Help';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from '@date-io/date-fns';
import axiosInstance from '../functions/axiosAPI';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import '../assets/leaflet.css'
import L from 'leaflet';
import icon from '../assets/images/marker-icon.png'
import iconShadow from '../assets/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [10, 41],
    popupAnchor: [2, -40],
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;
//https://stackoverflow.com/questions/49441600/react-leaflet-marker-files-not-found

const useStyles = makeStyles((theme) => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '25ch',
        },
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));



export default function SettingsPage(props) {
    const settings = props.settings
    const setSettings = props.setSettings
    const classes = useStyles();
    const GetCoord = () => {
        const map = useMapEvents({
            click: (e) => {
                setSettings(prevState => ({ ...prevState, stationLong: parseFloat(e.latlng.lng).toFixed(4), stationLat: parseFloat(e.latlng.lat).toFixed(4) }))
            }
        })
        return <Marker position={{ lng: settings.stationLong, lat: settings.stationLat }}></Marker>
    }
    const handleSubmit = (evt) => {
        evt.preventDefault();
        var apiRoute
        if (evt.nativeEvent.submitter.name === 'database') {
            apiRoute = '/settings/'
        }
        else {
            apiRoute = '/save_to_session/'
        }
        axiosInstance.post(apiRoute, settings)
            .then(response => alert(response.data))
            .catch(error => alert(error.response.data))
        setTimeout(() => props.setrefetchData(!props.refetchData), 1000)
    }
    const addSat = () => {
        const newSat = { NORADid: 0, name: "New Satellite", priority: 0 }
        var list = Object.values(settings['satList'])
        list.forEach((sat, ind) => sat['priority'] = ind + 1) //Move all priority down 1
        list.unshift(newSat)
        list.forEach((data, ind) => setSettings(
            (prevSetting) => ({
                ...prevSetting, satList: {
                    ...prevSetting.satList, [ind]: data
                }
            })
        ));
    }
    const deleteSat = (_, index) => {
        var list = Object.values(settings['satList'])
        list.splice(index, 1)
        list.forEach((sat, ind) => sat['priority'] = ind)
        var newSatList = {}
        list.forEach((data, ind) => (newSatList = {
            ...newSatList, [ind]: data
        }));
        setSettings((prevSetting) => ({ ...prevSetting, satList: newSatList }))
    }
    const UserStatus = () => {
        const [logInFormState, setLogInFormState] = useState(false);
        const [signUpFormState, setSignUpFormState] = useState(false);
        const [username, setUsername] = useState(null);
        const [password, setPassword] = useState(null);
        const [password2, setPassword2] = useState(null);
        const [email, setEmail] = useState(null);

        if (logInFormState === true) {
            return (
                <form className={classes.root} autoComplete="off"
                    onSubmit={(e) => {
                        e.preventDefault()
                        axiosInstance.post('/logIn/',
                            { username: username, password: password })
                            .then(() => window.location.reload()).catch(() => alert('Username or password incorrect.'))
                    }}>
                    <div>
                        <TextField
                            id="username"
                            label="Username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <TextField
                            id="password"
                            label="Password"
                            required
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button onClick={() => setLogInFormState(false)}>Back</Button>
                    <Button type='submit'>Submit</Button>
                </form>)
        }
        if (signUpFormState === true) {
            return (
                <form className={classes.root} autoComplete="off"
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (password !== password2) {
                            alert('Passwords do not match.')
                            return
                        }
                        axiosInstance.post('/new_user/', { username: username, email: email, password: password })
                            .then((res) => {
                                if (res.status === 200) { alert('Username taken.') }
                                if (res.status === 201) {
                                    alert('New user created.')
                                    axiosInstance.post('/logIn/',
                                        { username: username, password: password })
                                    window.location.reload()
                                }
                            })

                    }}>
                    <div>
                        <TextField
                            id="username"
                            label="Username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <TextField
                            id="email"
                            label="Email"
                            required
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <TextField
                            id="password"
                            label="Password"
                            required
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <TextField
                            id="password2"
                            label="Confirm password"
                            required
                            type='password'
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)} />
                    </div>
                    <Button onClick={() => setSignUpFormState(false)}>Back</Button>
                    <Button type='submit' >Submit</Button>
                </form>)
        }
        if (logInFormState === false && signUpFormState === false) {
            return (
                <React.Fragment className={classes.root}>
                    <p>Not logged in</p>
                    <Button variant='contained' onClick={() => setLogInFormState(true)} style={{ marginRight: "5%" }}>Log in</Button>
                    <Button variant='contained' onClick={() => setSignUpFormState(true)}>Sign up</Button>
                </React.Fragment>)
        }
    }

    return (
        <div style={{
            textAlign: "center", color: "white",
        }}>
            <h2>Settings</h2>
            {settings === false ? (<div>Loading...</div>) : (
                <Grid
                    container
                    direction="row"
                    spacing={1}
                    justify="center"

                    style={{
                        margin: 0,
                        width: '100%',
                    }}
                >
                    <Grid item >
                        <Paper>
                            <Box m={3}>
                                <Box m={1}>
                                    <span style={{ float: 'right' }}>
                                        <IconButton size='small' onClick={() => { if (Object.values(settings['satList']).length < 18) { addSat() } }}>
                                            <AddIcon />
                                        </IconButton>
                                    </span>
                                    <h4 style={{ paddingTop: 5 }}>
                                        Satellites
                                        <Tooltip title="Drag satellites to arrange priority">
                                            <HelpIcon style={{ fontSize: 14, paddingLeft: 6 }} />
                                        </Tooltip>
                                    </h4>
                                    <p>NORAD IDs can be found at <a href="https://celestrak.com/satcat/search.php">Celestrak</a></p>
                                </Box>

                                <Table deleteSat={deleteSat} settingIn={settings} setSettings={setSettings} />
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item>
                        <Paper>
                            <Box pb={3} m={3}>
                                <h4 style={{ paddingTop: 5 }}>User</h4>
                                {props.userSession === null
                                    ? (
                                        <UserStatus />)
                                    : (<div>
                                        <p>Logged in as: {props.userSession}</p>
                                        <Button variant="contained" onClick={() => axiosInstance.get('/logout/').then(() => window.location.reload())}>Log out</Button>
                                    </div>)}
                            </Box>
                        </Paper>
                        <Paper>
                            <h4 style={{ paddingTop: 5 }}>Station</h4>
                            <Box pb={3} m={3}>
                                <form onSubmit={handleSubmit} className={classes.root}>
                                    <MapContainer
                                        center={[settings.stationLat, settings.stationLong]}
                                        zoom={5} scrollWheelZoom={false}
                                        onClick={(evt) => console.log(evt)}
                                        style={{ minHeight: 300 }}>
                                        <GetCoord />
                                        <TileLayer
                                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                    </MapContainer>
                                    <div>
                                        <TextField
                                            id="Longitude-setting"
                                            label="Station longitude"
                                            type="number"
                                            value={settings.stationLong}
                                            inputProps={{ maxLength: 6 }}
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => {
                                                if (e.target.value >= -180 && e.target.value <= 180) {
                                                    setSettings(prevState => ({ ...prevState, stationLong: e.target.value }))
                                                }
                                            }}
                                            variant="filled"
                                        />
                                        <TextField
                                            id="Latitude-setting"
                                            label="Station latitude"
                                            type="number"
                                            value={settings.stationLat}
                                            inputProps={{ maxLength: 6 }}
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => {
                                                if (e.target.value >= -90 && e.target.value <= 90) {
                                                    setSettings(prevState => ({ ...prevState, stationLat: e.target.value }))
                                                }
                                            }}
                                            variant="filled"
                                        />
                                    </div>
                                    <FormControl variant="filled" className={classes.formControl}>
                                        <InputLabel id="demo-simple-select-filled">
                                            Start time</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-helper-label"
                                            id="demo-simple-select-helper"
                                            value={settings.predictionType}
                                            onChange={e => {
                                                setSettings(prevState => ({ ...prevState, predictionType: e.target.value }))
                                            }}
                                        >
                                            <MenuItem value={'realtime'}>Real-time</MenuItem>
                                            <MenuItem value={'custom'}>Custom</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {settings.predictionType === 'custom'
                                        ? (<MuiPickersUtilsProvider utils={DateFnsUtils}>
                                            <DateTimePicker
                                                label="Custom start time"
                                                inputVariant="outlined"
                                                value={settings.customStartTime}
                                                onChange={e => setSettings(prevState => ({ ...prevState, customStartTime: e }))}
                                            />
                                        </MuiPickersUtilsProvider>)
                                        : (<div></div>)}
                                    <div>
                                        <TextField
                                            id="prediction-time-setting"
                                            label="Prediction duration (Hours)"
                                            value={settings.predHours}
                                            type="number"
                                            InputProps={{ inputProps: { min: 0, max: 24 } }}
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => setSettings(prevState => ({ ...prevState, predHours: e.target.value }))}
                                            variant="filled"
                                        />
                                    </div>
                                    <div>
                                        <TextField
                                            id="elevation-setting"
                                            label="Minimum Elevation (&#176;)"
                                            type="number"
                                            InputProps={{ inputProps: { min: 0, max: 90 } }}
                                            value={settings.minElevation}
                                            InputLabelProps={{ shrink: true }}
                                            onChange={e => setSettings(prevState => ({ ...prevState, minElevation: e.target.value }))}
                                            variant="filled"
                                        />
                                    </div>
                                    <Tooltip title='Must be logged in'>
                                        <Button
                                            type='submit'
                                            variant='contained'
                                            name='database'
                                            disabled={props.userSession === null
                                                ? (true)
                                                : (false)}
                                            style={{ margin: 5, marginLeft: 0 }}>
                                            Save settings
                                        </Button>
                                    </Tooltip>
                                    <div>
                                        <Button
                                            type='submit'
                                            variant="contained"
                                            name='session'
                                            style={{ margin: 5, marginRight: 0 }}>
                                            Apply settings
                                        </Button>
                                        <Button
                                            variant="contained"
                                            name='discard session'
                                            onClick={() => axiosInstance.get('discard_session/').then(() => window.location.reload())}
                                            style={{ margin: 5, marginRight: 0 }}>
                                            Discard settings
                                        </Button>
                                    </div>
                                </form>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

            )}
        </div>
    )
}