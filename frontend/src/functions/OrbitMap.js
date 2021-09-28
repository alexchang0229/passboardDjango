import React, { useState, useEffect } from 'react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
    Graticule
} from "react-simple-maps";
import axiosInstance from './axiosAPI';
import mapJson from "../assets/geos.json"

const geoUrl = mapJson
//"https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json";

export default function OrbitMap(props) {
    const [mapCoords, setMapCoords] = useState(false)
    useEffect(() => {
        axiosInstance.post('/mapviewInfo/', props.aostime)
            .then(res => setMapCoords(res.data))
    }, [props.aostime])
    return (
        <React.Fragment>
            {mapCoords === false
                ? (<div>loading</div>)
                : (<ComposableMap
                    projection="geoEqualEarth"
                    projectionConfig={{
                        scale: 150,
                        center: [0, 0]//mapCoords[2]
                    }}
                    width={800} height={400} style={{ width: "100%", height: "100%" }}>
                    <Graticule stroke="#969696" />
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map(geo => (
                                <Geography key={geo.rsmKey} geography={geo} />
                            ))
                        }
                    </Geographies>
                    <Marker coordinates={mapCoords[2]}>
                        <circle r={4} fill="#F53" />
                    </Marker>
                    <Marker coordinates={mapCoords[0]}>
                        <circle r={4} fill="#F53" />
                        <text textAnchor="middle" x="-20" fill="#F53">
                            AOS
                        </text>
                    </Marker>
                    <Marker coordinates={mapCoords[1]}>
                        <circle r={4} fill="#F53" />
                        <text textAnchor="middle" x="-20" fill="#F53">
                            LOS
                        </text>
                    </Marker>
                    <Line
                        from={mapCoords[0]}
                        to={mapCoords[1]}
                        stroke="#FF5533"
                        strokeWidth={4}
                        strokeLinecap="round"
                    />
                </ComposableMap>)
            }
        </React.Fragment >
    )
}
