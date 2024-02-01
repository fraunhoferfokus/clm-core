# What is the Common Learning Middleware?

Connecting disparate learning environments into educational ecosystems using open standards is a core use case of the Common Learning Middleware (CLM). Based on the best-of-breed approach, various providers of educational offerings can connect their learning content as learning nuggets via the CLM using a publish-subscribe system in order to increase their own reach. The CLM supports common standards of a seamless educational journey - to facilitate integration - and is also able to translate from one standard of a client system to the other or the same standard of the target system at the runtime of a request. 

CLM serves as a mediator between learning platforms and learning content, while the integration of further standards enables consumers to offer extended services, such as AI-supported systems, recommender systems or learning analytics systems via the CLM.

The two videos below explain CLM from the perspective of a user and provider.

#### User
https://github.com/fraunhoferfokus/clm-core/assets/135810890/f04e54cc-11ca-4456-ada2-f24c155fe550


#### Provider
https://github.com/fraunhoferfokus/clm-core/assets/135810890/04791f9f-92e7-4558-a90f-d59d2f7f0153

## CLM-CORE
This is the core module from which all other microservices inherit to extend their own functionality. The focus here is on user and rights management as well as the relationship model. Together with the other six services, this forms the Open-Core package of the Common Learning Middleware.

## Requirements
- MariaDB, set up locally.
- Node.js 20.x

### Folder Structure
root

├── api-docs # Open API 3.0.0 definition as .yaml file documenting all routes and data models this service offers.

├── docs # Developer documentation of all functions, classes, interfaces, types this service exposes as an npm package.

├── dist # The built TypeScript project transpiled to JavaScript.

└── src # Business-relevant logic for this web server.


### Architecture
![Entit Relationship Model](assets/clm.EntityRelationshipdiagram.v1p0p0.svg)



The Entity Relationship Model of the Open Core is shown above. 

The clm-core module includes the management of the following resources:

#### Groups
- Can be nested hierarchically.
- Users can be assigned to groups.
- Access to resources is controlled by group permissions, which is context-dependent.

#### Roles
- Always associated with a group.
- Specifies the permissions for accessing resources.

#### Users
- Can be registered through federated identity in the CLM, created through CLM's in-house user management, or added by an administrative person.
- Assigned to one or more groups.

#### Paths
- Represents a REST interface.
- A path is created for each interface offered by a microservice of the Open-Core.
- Paths are protected.

#### Consumers
- Entities that use the interfaces (paths) of the Open-Core.
- Assigned to groups which have access to specific paths.
- Permissions for paths are regulated through group assignments.

#### Relations
- Each resource is interconnected through a relation document.
- Join tables or graphs enable a flexible permission model.

This service functions as a web microservice that can be orchestrated through a gateway and as an npm package to provide functionalities to other CLM extensions. A microservice can build upon the classes/types/interfaces of this service to extend basic functionalities.

## Setup for Testing the Webserver
1. `npm install`
2. Copy `.env.default` to `.env` and overwrite necessary properties.

   The following table gives an overview of the settings you can change through the environment variables:

   | Name                   | Example                                                                           | Required (Yes/No) | Description                                                                                                     |
   | ---------------------- | --------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
   | `PORT`                 | `3001`                                                                            | Yes               | The port on which the service should be deployed.                                                               |
   | `DEPLOY_URL`           | `HOST_PROTOCOL://HOST_ADDRESS:GATEWAY_PORT/api`                                   | Yes               | The address where all microservices are to be orchestrated. A `/api` must be appended.                          |
   | `MARIA_CONFIG`         | `MARIA_HOST_ADDRESS\|MARIA_PORT\|MARIA_DATABASE\|MARIA_USER\|MARIA_USER_PASSWORD` | Yes               | A slash-separated string containing the configured parameters for MariaDB.                                      |
   | `CLM_ROOT_USER`        | `example@example.com`                                                             | Yes               | The username of the admin user installed during CLM setup.                                                      |
   | `CLM_ROOT_PASSWORD`    | `CLM_ROOT_PASSWORD`                                                               | Yes               | The password of the admin user installed during CLM setup.                                                      |
   | `TOKEN_SECRET`         | `secret`                                                                          | Yes               | Secret used to sign and verify JWTs for authentication. Have to be the same across all modules of the Open-Core |
   | `SMTP_FROM`            | `example@example.de`                                                              | No                | Configurations for the SMTP service used for sending emails.                                                    |
   | `SMTP_HOST`            | `smtp.example.com`                                                                | No                | Configurations for the SMTP service used for sending emails.                                                    |
   | `SMTP_PORT`            | `465`                                                                             | No                | Configurations for the SMTP service used for sending emails.                                                    |
   | `SMTP_USER`            | `example@user.de`                                                                 | No                | Configurations for the SMTP service used for sending emails.                                                    |
   | `SMTP_PASS`            | `examplepassword`                                                                 | No                | Configurations for the SMTP service used for sending emails.                                                    |
   | `REDIS_CONFIG`         | `localhost:6379`                                                                  | No                | Configuration information for Redis. Defaults to example value if not set.                                      |
   | `DISABLE_ERR_RESPONSE` | `true`                                                                            | No                | Flag to control whether error responses should be returned. Defaults to example value if not set.               |
   | `OIDC_PROVIDERS`       | [{"authorization_endpoint": "http://to_authorization_endpoint" }]                 | No                | Whether to allow access_token from external OIDC providers                                                      |
   | `API_TOKEN`            |                                                                                   | No                | Defaults to MGMT_SERVICE if not set. Needed to access the CLM-API
3. `npm run dev` for development with nodemon.
4. `npm start` for deployment.

## For Consumption as an NPM Package

- Documentation about all exposed modules can be found under `/docs`.
- Include the package in your project's `package.json` dependencies:

    ```json
    "dependencies": {
        "clm-core": "git+https://$token:$token@$url_of_package#$branch_name"
    }
    ```

- To use database-dependent DAOs/DTOs, inject `MARIA_CONFIG` into the environment before importing the module:

    a) Manually in the code:

    ```javascript
    process.env.MARIA_CONFIG = "localhost|3306|clm|root|12345";
    import * as core from 'clm-core';
    ```

    b) Through `.env` file:

    ```.env
    MARIA_CONFIG=localhost|3306|clm|root|12345
    ```

    ```javascript
    import * as core from 'clm-core';
    ```

# Swagger Documentation

- Accessible routes for this microservice are available at `http://localhost:PORT/core/swagger` after starting the service.
- Ensure to set up a reverse proxy to route traffic to the respective microservices as shown in the table.

### Changelog

The changelog can be found in the [CHANGELOG.md](CHANGELOG.md) file.

## Get in touch with a developer

Please see the file [AUTHORS.md](AUTHORS.md) to get in touch with the authors of this project.
We will be happy to answer your questions at {clm@fokus.fraunhofer.de}

## License


The project is made available under the license in the file [LICENSE.txt](LICENSE.txt)
