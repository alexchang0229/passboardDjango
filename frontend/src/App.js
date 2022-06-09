import React, { useState, useEffect } from 'react';
import './App.css';
import PassTimeTable from './pages/PassTimeTable.js';
import SettingsPage from './pages/SettingsPage.js';
import AboutPage from './pages/AboutPage.js';
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { createTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

const theme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: '#e8e8e8',
    },
  }
});

function App() {
  const [passData, setPassData] = useState(false);
  const [userSession, setuserSession] = useState(null);
  const [refetchData, setrefetchData] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    fetch('/api/passData/').then(res => res.json()).then(data => {
      setPassData(data);
    }).catch((e) => {
      console.log(e)
      alert('Error fetching data from server.')
    });
    fetch('/api/settings/').then(res => res.json()).then(data => {
      setSettings(data);
    });
  }, [refetchData]);
  useEffect(() => {
    fetch('/api/userInfo/').then(res => res.json()).then(data => {
      setuserSession(data);
    }).catch((e) => console.log('Not signed in.'));
  }, []);
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#282c34" }}>
      <Router>
        <ThemeProvider theme={theme}>
          <div className="App">
            &emsp;
            <Link to='/SettingsPage'>
              Settings
            </Link>&emsp;
            <Link to="" style={{ textAlign: "left" }}>
              Passboard
            </Link>&emsp;
            <Link to="/About">
              About
            </Link>
            <Switch>
              <Route path="/SettingsPage">
                <SettingsPage
                  settings={settings}
                  setSettings={setSettings}
                  userSession={userSession}
                  setrefetchData={setrefetchData}
                  refetchData={refetchData} />
              </Route>
              <Route path="/About">
                <AboutPage />
              </Route>
              <Route path="/">
                <PassTimeTable
                  passData={passData}
                  setPassData={setPassData}
                  settings={settings} />
              </Route>
            </Switch>
          </div>
        </ThemeProvider>
      </Router>
    </div>
  );
}

export default App;
