import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const databaseUsername = config.require("dbUsername");
export const databasePassword = config.requireSecret("dbPassword");
export const jwtSecret = config.requireSecret("jwtSecret");
export const mailtrapUser = config.require("mailtrapUser");
export const mailtrapPass = config.requireSecret("mailtrapPass");
export const valkeyPassword = config.requireSecret("valkeyPassword");