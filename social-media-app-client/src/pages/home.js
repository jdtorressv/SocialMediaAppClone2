import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import axios from 'axios';
import Tweet from '../components/Tweet';

export class home extends Component {
  state = {
    tweets: null,
  };
  componentDidMount() {
    axios
      .get('/tweets')
      .then((res) => {
        this.setState({
          tweets: res.data,
        });
      })
      .catch((err) => console.log(err));
  }
  render() {
    let recentTweetsMarkup = this.state.tweets ? (
      this.state.tweets.map((tweet) => (
        <Tweet key={tweet.tweetId} tweet={tweet} />
      ))
    ) : (
      <p>Loading...</p>
    );
    return (
      <Grid container spacing={2}>
        <Grid item sm={8} sx={12}>
          {recentTweetsMarkup}
        </Grid>
        <Grid item sm={4} sx={12}>
          <p>Profile...</p>
        </Grid>
      </Grid>
    );
  }
}

export default home;
