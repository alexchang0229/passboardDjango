import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card'
import { Box } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    result.forEach((data, index) => data.priority = index)
    return result;
};

const grid = 6;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: 3,
    margin: `0 0 ${grid}px 0`,
    // change background colour if dragging
    background: isDragging ? "gray " : "#525252",
    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    //background: isDraggingOver ? "lightblue" : "lightgrey",
    padding: grid,
    width: 250
});

export default function Table(props) {
    const [list, setlist] = useState(Object.values(props.settingIn.satList));

    useEffect(() => {
        setlist(Object.values(props.settingIn.satList))
    }, [props.settingIn])

    function onDragEnd(result) {
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        const newlist = reorder(
            list,
            result.source.index,
            result.destination.index
        );
        newlist.forEach((data, ind) => props.setSettings(
            (prevSetting) => ({
                ...prevSetting, satList: {
                    ...prevSetting.satList, [ind]: data
                }
            })
        ));
        setlist(newlist);
    }
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable">
                {(provided, snapshot1) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={getListStyle(snapshot1.isDraggingOver)}
                    >
                        {Object.values(list).map((satellite, index) => (
                            <Draggable key={satellite.name} draggableId={satellite.name} index={index}>
                                {(provided, snapshot) => (
                                    <Card
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style,
                                        )}
                                    >
                                        <Box m={1}>
                                            <b style={{ textAlign: 'left' }}>
                                                {satellite.name}
                                            </b>
                                            <Tooltip title="Priority">
                                                <span style={{ float: 'left', fontSize: 12 }}>
                                                    {satellite.priority}
                                                </span>
                                            </Tooltip>
                                            <span style={{ float: 'right' }}>
                                                <IconButton size='small' onClick={(e) => props.deleteSat(e, index)}>
                                                    <DeleteIcon fontSize='small' />
                                                </IconButton>
                                            </span>
                                        </Box>
                                        <TextField
                                            id={"NORAD-tracking-number" + index}
                                            label="NORAD tracking number"
                                            value={list[index]['NORADid']}
                                            type="number"
                                            InputLabelProps={{ shrink: true }}
                                            onInput={(e) => {
                                                e.target.value = e.target.value.toString().slice(0, 5)
                                            }}
                                            onChange={(e) => {
                                                var newlist = list
                                                newlist[index]['NORADid'] = e.target.value
                                                return setlist([...newlist])
                                            }}
                                            variant="outlined"
                                        />
                                    </Card>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext >
    );

}
