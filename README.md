## FBW API

## Running the API

### Locally

Run the `setup.sh` script to create the required secrets for the service to connect to a database.
After that services can be started using default `docker-compose` commands.

```bash
# install all dependencies
$ npm install

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Production

Run the command `setup.sh` to set up the secrets.
After that services can be started using default `docker-compose` commands.
