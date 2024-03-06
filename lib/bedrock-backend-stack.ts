import { Duration, Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import * as cdk from "aws-cdk-lib";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as awssns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export class BedrockCsDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const email = this.node.tryGetContext("email");
    const infoTable = new dynamodb.Table(this, "information", {
      partitionKey: { name: "age", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Create an SNS topic
    const myTopic = new awssns.Topic(this, "MyTopic", {
      displayName: "My Sample SNS Topic",
    });

    // Create a subscription (e.g., to send notifications to an email)
    myTopic.addSubscription(new subs.EmailSubscription(email));

    //lambda
    const getdbLambda = new lambda.Function(this, "getdb", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/getdb.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      environment: {
        DYNAMODB_TABLE_NAME: infoTable.tableName,
        REGION: infoTable.env.region,
      },
      runtime: lambda.Runtime.PYTHON_3_9,
    });
    const bedrockLambda = new lambda.Function(this, "bedrock", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/bedrock.py", { encoding: "utf-8" })
      ),
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_9,
    });
    const snsLambda = new lambda.Function(this, "sns", {
      code: new lambda.InlineCode(
        fs.readFileSync("lambda/sns.py", { encoding: "utf-8" })
      ),
      environment: {
        TOPICARN: myTopic.topicArn,
      },
      handler: "index.lambda_handler",
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    //service execution role
    getdbLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: ["*"],
      })
    );

    bedrockLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:*"],
        resources: ["*"],
      })
    );

    snsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["sns:*"],
        resources: ["*"],
      })
    );

    //task generation
    const getdb = new tasks.LambdaInvoke(this, "getdbLambda", {
      lambdaFunction: getdbLambda,
      outputPath: "$.Payload",
    });
    const bedrock = new tasks.LambdaInvoke(this, "bedrockLambda", {
      lambdaFunction: bedrockLambda,
      outputPath: "$.Payload",
    });
    const sns = new tasks.LambdaInvoke(this, "snsLambda", {
      lambdaFunction: snsLambda,
      outputPath: "$.Payload",
    });

    //chain
    const choice = new sfn.Choice(this, "Is emotion Negative?");
    const successState = new sfn.Pass(this, "SuccessState");
    choice.when(sfn.Condition.stringEquals("$.emotion", "NEGATIVE"), sns);
    choice.otherwise(successState);
    bedrock.next(choice);
    const definition = getdb.next(bedrock);

    //statemachine
    const stateMachine = new sfn.StateMachine(this, "stateMachine", {
      definition,
      timeout: cdk.Duration.minutes(15),
      stateMachineType: sfn.StateMachineType.EXPRESS,
    });

    //lambda role
    getdbLambda.grantInvoke(stateMachine.role);
    bedrockLambda.grantInvoke(stateMachine.role);
    snsLambda.grantInvoke(stateMachine.role);

    const restApi = new apigateway.RestApi(this, "API Endpoint", {
      restApiName: "API Endpoint",
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // this is also the default
        allowHeaders: [
          "Origin, X-Api-Key, X-Requested-With, Content-Type, Accept, Authorization, access-control-allow-origin",
        ],
        allowCredentials: true,
      },
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
      deployOptions: {
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
    });
    restApi.root.addMethod(
      "POST",
      apigateway.StepFunctionsIntegration.startExecution(stateMachine)
    );

    new CfnOutput(this, "STATEMACHINE", {
      value: stateMachine.stateMachineArn,
    });
  }
}
