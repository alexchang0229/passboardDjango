import React from 'react'
import { Grid, Paper } from '@material-ui/core';
import LinkedInButton from '../assets/LinkedIn-Button.png'
import Instructions_picture from '../assets/instructions.png'



export default function AboutPage() {

    return (
        <div className="App-header">
            <Grid
                container
                direction="row"
                justify="center"
                style={{
                    marginTop: '5%',
                    marginBottom: '5%',
                    width: '100%',
                }}>
                <Grid item md={7} sm={12} >
                    <Paper>
                        <h1>About</h1>
                        <img src={Instructions_picture} alt="Instructions" style={{
                            maxWidth: '100%',
                            height: 'auto'
                        }} />
                        <p>This app was built by Alex Chang</p>
                        <a href="https://www.linkedin.com/in/alexyuchang/" target="_blank" rel="noreferrer">
                            <img src={LinkedInButton} alt="LinkedIn Icon" height={100} />
                        </a>
                    </Paper>
                </Grid>
            </Grid>
        </div >
    )
}
