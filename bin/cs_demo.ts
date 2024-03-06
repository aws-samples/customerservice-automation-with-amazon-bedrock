#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BedrockCsDemoStack } from "../lib/bedrock-backend-stack";
import { UserInterfaceStack } from "../lib/user-interfacte-stack";

const app = new cdk.App();
new BedrockCsDemoStack(app, "BedrockCsDemoStack");
new UserInterfaceStack(app, "UserInterfaceStack");