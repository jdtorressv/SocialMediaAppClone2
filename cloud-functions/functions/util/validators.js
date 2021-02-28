const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; 
    if (email.match(regEx)) return true;
    else return false; 
}
const isEmpty = (string) => {
    if (string.trim() === "") return true; 
    else return false; 
}

exports.validateSignupData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) errors.email = "Must not be be empty";
    else if (!isEmail(data.email)) errors.email = "Email address must be valid";
    if (isEmpty(data.password)) errors.password = "Must not be be empty";
    if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";
    if (isEmpty(data.handle)) errors.handle = "Must not be be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

exports.validateLoginData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) errors.email = "Must not be empty";
    if (isEmpty(data.password)) errors.password = "Must not be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }

}

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    let webtrim = data.website.trim(); 
    if (!isEmpty(webtrim)) {
        userDetails.website = webtrim.substring(0,4) !== 'http' ? `http://${webtrim}` :  data.website;       
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
}