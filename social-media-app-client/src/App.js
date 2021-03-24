import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core';
import jwtDecode from 'jwt-decode';

//Redux Stuff
import { Provider } from 'react-redux';
import store from './redux/store';

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

let authenticated = false;
let tokExpAck = false;
const token = localStorage.FBIdToken;

if (token) {
  const decodedToken = jwtDecode(token);
  console.log(`Recorded token expiraton: ${new Date(decodedToken.exp * 1000)}`);
  if (decodedToken.exp * 1000 < Date.now()) {
    if (!tokExpAck) {
      console.log('Recorded token has expired');
      window.location.href = '/login';
      authenticated = false;
      tokExpAck = true;
    } else {
      console.log('We have already pushed to login page as token is expired');
    }
  } else {
    authenticated = true;
    console.log('Recorded token is current');
  }
} else {
  console.log('No token recorded');
}

class App extends Component {
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <Provider store={store}>
          <Router>
            <Navbar />
            <div className="container">
              <Switch>
                <Route exact path="/" component={home} />
                <AuthRoute
                  exact
                  path="/login"
                  component={login}
                  authenticated={authenticated}
                />
                <AuthRoute
                  exact
                  path="/signup"
                  component={signup}
                  authenticated={authenticated}
                />
              </Switch>
            </div>
          </Router>
        </Provider>
      </MuiThemeProvider>
    );
  }
}

export default App;
