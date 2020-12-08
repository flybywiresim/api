![FlyByWireLogo](https://raw.githubusercontent.com/flybywiresim/fbw-branding/master/svg/FBW-Logo.svg)
## FlyByWire Simulations API

### Developing

Run the `setup.sh` script to create the required secrets for the service to connect to a database.
After that services can be started using `docker-compose -f docker-compose.dev.yml up -d` commands.

```bash
# install all dependencies
$ npm install

# watch mode
$ npm run start:dev
```
