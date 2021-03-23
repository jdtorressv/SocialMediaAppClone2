import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';
import jwtDecode from 'jwt-decode';

//Components
import Navbar from './components/Navbar';
import AuthRoute from './util/AuthRoute';

//Pages
import home from './pages/home';
import login from './pages/login';
import signup from './pages/signup';
import axios from 'axios';

axios.defaults.baseURL =
  'https://us-central1-socialmediaappclone2.cloudfunctions.net/api';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#33c9dc',
      main: '#00bcd4',
      dark: '#008394',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff6333',
      main: '#ff3d00',
      dark: '#b22a00',
      contrastText: '#fff',
    },
  },
  typography: {
    useNextVariants: true,
  },
});

let authenticated;
const token = localStorage.FBIdToken;

if (token) {
  const decodedToken = jwtDecode(token);
  if (decodedToken.exp * 1000 < Date.now()) {
    // Token has expired
    window.location.href = '/login';
    authenticated = false;
  } else {
    authenticated = true;
  }
}

class App extends Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <div className="App">
          <Router>
            <Navbar />
            <div className="container">
              <Switch>
                <Route exact path="/" component={home} />
                <AuthRoute
                  path="/login"
                  authenticated={authenticated}
                  component={login}
                />
                <AuthRoute
                  path="/signup"
                  authenticated={authenticated}
                  component={signup}
                />
              </Switch>
            </div>
          </Router>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
