import React from 'react'
import { Grid, Paper } from '@material-ui/core';
import LinkedInButton from '../assets/linkedin-button.png'
import Instructions_picture from '../assets/instructions.png'
import github_picture from '../assets/githubicon.png'


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
                    <Paper style={{ padding: "5%" }}>
                        <h1>About</h1>
                        <img src={Instructions_picture} alt="Instructions" style={{
                            maxWidth: '100%',
                            height: 'auto'
                        }} />
                        <p>This app was built by Alex Chang</p>
                        <a href="https://www.linkedin.com/in/alexyuchang/" target="_blank" rel="noreferrer">
                            <img src={LinkedInButton} alt="LinkedIn Icon" height={80} style={{ marginRight: '5%' }} />
                        </a>
                        <a href="https://github.com/alexchang0229/passboardDjango" target="_blank" rel="noreferrer">
                            <img src={github_picture} alt="Github Icon" height={80} />
                        </a>
                    </Paper>
                </Grid>
            </Grid>
        </div >
    )
}
