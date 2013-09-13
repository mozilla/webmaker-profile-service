[![Dependency Status](https://gemnasium.com/gvn/webmaker-profile-service.png)](https://gemnasium.com/gvn/webmaker-profile-service)

# Webmaker Profile Service

A REST-ful service for Webmaker Profile.

## Routes

### GET /user-data/USERNAME

Returns all JSON necessary for the initial build of the profile for *USERNAME*.

### GET /user-data/USERNAME/KEY

Returns specific key value from *USERNAME*'s data.

### POST /user-data/USERNAME

Send any JSON to be appended to *USERNAME*'s data .

## Setup

`npm install`
