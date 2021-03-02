import React, { Component } from "react";
import { Link } from "react-router-dom";
import {
  withStyles,
  Card,
  CardContent,
  CardMedia,
  Typography,
} from "@material-ui/core";

const styles = {
  card: {
    display: "flex",
    marginBottom: 20,
  },
  image: {
    minWidth: 200,
  },
  conent: {
    padding: 25,
    objectFit: "cover",
  },
};
class Tweet extends Component {
  render() {
    const {
      classes,
      tweet: {
        body,
        createdAt,
        userImage,
        userHandle,
        tweetId,
        likeCount,
        commentCount,
      },
    } = this.props;
    return (
      <Card className={classes.card}>
        <CardMedia
          image={userImage}
          className={classes.image}
          title="Profile image"
        />
        <CardContent class={classes.content}>
          <Typography
            variant="h5"
            component={Link}
            to={`/users/${userHandle}`}
            color="primary"
          >
            {userHandle}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {createdAt}
          </Typography>
          <Typography variant="body1">{body}</Typography>
        </CardContent>
      </Card>
    );
  }
}

export default withStyles(styles)(Tweet);
