<img src="https://raw.githubusercontent.com/flybywiresim/fbw-branding/master/png/FBW-Logo.png" placeholder="Flybywire" width="300"/>

## Running the API

### Locally

Run the `setup.sh` script to create the required secrets for the service to connect to a database.
After that services can be started using `docker-compose -f docker-compose.dev.yml up -d` commands.

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

### Specific environment

Run the command `setup.sh` to set up the secrets.
Adapt the secrets with your passwords.
Create a .env-file in the `envs` directory containing the configuration.
After that services can be started using `docker-compose --env-file ./envs/<<your-config>> up -d` commands.
