import React, { useState, useRef, useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableHead from '@material-ui/core/TableHead';
import Grid from '@material-ui/core/Grid';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Clock from 'react-live-clock';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import Countdown from 'react-countdown';
import Link from '@material-ui/core/Link';
import { CSVLink } from "react-csv";
import OrbitMap from "../functions/OrbitMap.js";
import LinearProgress from '@material-ui/core/LinearProgress';
import axiosInstance from '../functions/axiosAPI.js';



const useStyles = makeStyles({
    grid: {
        paddingBottom: "10vh",
        paddingTop: "3vh",
        width: '100%',
        overflowX: 'auto',
    }
});

function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const headCells = [
    { id: 'satName', alignDirection: 'left', label: 'Satellite name' },
    { id: 'orbitnum', alignDirection: 'left', label: 'Orbit' },
    { id: 'start', alignDirection: 'center', label: 'AOS' },
    { id: 'end', alignDirection: 'center', label: 'LOS' },
    { id: 'duration', alignDirection: 'right', label: 'Duration' },
];


const AOSLOSTime = _time => {
    const passEpoch = new Date(0)
    passEpoch.setUTCSeconds(_time);
    return (`${dayOfYear(passEpoch)}-${("0" + passEpoch.getHours()).slice(-2)}`
        + `:${("0" + passEpoch.getMinutes()).slice(-2)}`
        + `:${("0" + passEpoch.getSeconds()).slice(-2)}`)
}

const dayOfYear = _date => {
    const passTime = _date
    return Math.floor((passTime - new Date(passTime.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
}

const passDuration = (_duration) => {
    var minutes = Math.floor(_duration / 60);
    var seconds = Math.round(_duration - minutes * 60);
    return `${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`
}


const TableRowFunc = (props) => {
    const rowdata = props.rowdata;
    const [open, setOpen] = useState(false);
    const [csvData, setcsvData] = useState('');
    const csvLink = useRef();
    const disableStyle = { color: 'dimgray' };
    const AOSEpoch = new Date(0);
    const LOSEpoch = new Date(0);

    const countDownRenderer = ({ hours, minutes, seconds, completed }) => {
        return `${completed ? ("+") : ("-")}${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`;
    };
    const csvHeaders = ['Unix time (s)', 'Elevation (deg)', 'Azimuth (deg)']
    const handleCSVDownload = async () => {
        await axiosInstance.post('/get_path_csv/', rowdata.start)
            .then(res =>
                setcsvData(res.data))
        csvLink.current.link.click()
    }
    return (
        <React.Fragment>
            <TableRow style={!rowdata.take
                ? { background: '#333333' }
                : null}>
                <TableCell align="left" style={rowdata.take ? null : disableStyle}>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" align="left" style={rowdata.take ? null : disableStyle}>
                    {rowdata.satName}
                </TableCell>
                <TableCell align="left" style={rowdata.take ? null : disableStyle}>{rowdata.orbitnum}</TableCell>
                <TableCell align="center" style={rowdata.take ? null : disableStyle}>{AOSLOSTime(rowdata.start)}</TableCell>
                <TableCell align="center" style={rowdata.take ? null : disableStyle}>{AOSLOSTime(rowdata.end)}</TableCell>
                <TableCell align="right" style={rowdata.take ? null : disableStyle}>{passDuration(rowdata.duration)}</TableCell>
            </TableRow>
            {props.nearestAOS / 1000 === rowdata.start && props.passState === true
                ? (<TableRow>
                    <TableCell colSpan={6}>
                        <LinearProgress variant="determinate" value={props.passProgress} />
                    </TableCell>
                </TableRow>)
                : null}
            <TableRow style={rowdata.take ? null : { background: '#333333' }}>
                <TableCell style={{ padding: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Table>
                            <TableBody>
                                <TableRow >
                                    <TableCell align="center" colSpan={3} width="45%">
                                        <Link
                                            style={{ color: '#abdbe3' }}
                                            onClick={handleCSVDownload}>
                                            Download path csv
                                        </Link>
                                        <CSVLink
                                            data={csvData}
                                            filename={`${rowdata.satName}-${rowdata.orbitnum}.csv`}
                                            className='hidden'
                                            ref={csvLink}
                                            target='_blank'
                                            headers={csvHeaders}
                                        />
                                    </TableCell>
                                    <TableCell align="center" style={rowdata.take ? null : disableStyle}>
                                        {props.settings.predictionType === "custom"
                                            ? (<Countdown
                                                date={AOSEpoch.setUTCSeconds(rowdata.start)}
                                                overtime={true}
                                                autoStart={false}
                                                daysInHours={true}
                                                now={() => Date.parse(props.settings.customStartTime)}
                                                renderer={countDownRenderer} />)
                                            : (<Countdown
                                                date={AOSEpoch.setUTCSeconds(rowdata.start)}
                                                overtime={true}
                                                daysInHours={true}
                                                renderer={countDownRenderer} />)}
                                    </TableCell>
                                    <TableCell align="center" style={rowdata.take ? null : disableStyle}>
                                        {props.settings.predictionType === "custom"
                                            ? (<Countdown
                                                date={AOSEpoch.setUTCSeconds(rowdata.start)}
                                                overtime={true}
                                                autoStart={false}
                                                daysInHours={true}
                                                now={() => Date.parse(props.settings.customStartTime)}
                                                renderer={countDownRenderer} />)
                                            : (<Countdown
                                                date={LOSEpoch.setUTCSeconds(rowdata.end)}
                                                overtime={true}
                                                daysInHours={true}
                                                renderer={countDownRenderer}
                                                onComplete={props.passFinished} />)}
                                    </TableCell>
                                    <TableCell colSpan={3} width="17%"></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align="center" colSpan={6}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            height: '120px',
                                            width: '100%',
                                            paddingBottom: '10%',
                                            marginTop: '-2%',
                                            marginBottom: '-2%'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                inset: '0%',
                                                width: '100%'
                                            }}>
                                                <OrbitMap orbitnum={rowdata.orbitnum} />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Collapse>
                </TableCell>
            </TableRow>

        </React.Fragment>
    )
}

export default function PassTimeTable(props) {
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState('start');
    const [passState, setPassState] = useState(false);
    const [passProgress, setPassProgress] = useState(0);
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const passFinished = useCallback(() => {
        setTimeout(() => {
            axiosInstance('passData/').then(res => {
                props.setPassData(res.data);
            }).catch((error) => console.log(error));
        }, 30000)
    }, [props])
    const classes = useStyles();
    const [nearestLOS, setNearestLOS] = useState(0);
    const [nearestAOS, setNearestAOS] = useState(0);
    useEffect(() => {
        let progressInterval
        let AOStimer
        let LOStimer
        if (props.passData !== false && props.settings.predictionType !== "custom") {
            for (var i = 0; i < props.passData.length; i++) {
                if (props.passData[i].take === true) {
                    setNearestAOS(props.passData[i].start * 1000)
                    setNearestLOS(props.passData[i].end * 1000)
                    break
                }
            }
            AOStimer = setTimeout(() => {
                setPassState(true)
                progressInterval = setInterval(() => {
                    setPassProgress((Date.now() - nearestAOS) / (nearestLOS - nearestAOS) * 100)
                }, 1000);
            }, nearestAOS - Date.now());
            LOStimer = setTimeout(() => {
                setPassState(false)
                passFinished()
            }, nearestLOS - Date.now());
            return () => {
                clearTimeout(AOStimer)
                clearTimeout(LOStimer)
                clearInterval(progressInterval)
            }
        }
    }, [props, nearestLOS, nearestAOS, passFinished])

    return (
        <header className="App-header">
            <Grid
                container
                direction="row"
                justify="center"
                style={{
                    margin: 0,
                    width: '100%',
                }}
            >
                <Grid item md={7} sm={12} className={classes.grid}>
                    {props.passData === false ? (<div>Waiting for passData from FlaskAPI...</div>) : (
                        <TableContainer component={Paper}>
                            <Table aria-label="simple table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" style={{ fontSize: "180%" }}>
                                            {props.settings.predictionType === "custom"
                                                ? (<Clock format="YYYY-DDD-HH:mm:ss" ticking={false} date={props.settings.customStartTime} />)
                                                : (<Clock format="YYYY-DDD-HH:mm:ss" ticking={true} />)
                                            }
                                        </TableCell>
                                    </TableRow>
                                    <TableRow >
                                        <TableCell />
                                        {headCells.map((headCell) => (
                                            <TableCell
                                                key={headCell.id}
                                                align={headCell.alignDirection}
                                                sortDirection={orderBy === headCell.id ? order : false}
                                            >
                                                <TableSortLabel
                                                    active={orderBy === headCell.id}
                                                    direction={orderBy === headCell.id ? order : 'asc'}
                                                    onClick={(event) => handleRequestSort(event, headCell.id)}
                                                >
                                                    {headCell.label}
                                                </TableSortLabel>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stableSort(Object.values(props.passData), getComparator(order, orderBy))
                                        .map((rowdata, index) => (
                                            <TableRowFunc
                                                rowdata={rowdata}
                                                key={rowdata.start}
                                                passFinished={passFinished}
                                                settings={props.settings}
                                                passState={passState}
                                                nearestAOS={nearestAOS}
                                                passProgress={passProgress} />
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                    }
                </Grid>
            </Grid>
        </header>
    );
}
