import {
  type App,
  aws_lambda_nodejs,
  custom_resources,
  CustomResource,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import { type HostedZone } from "aws-cdk-lib/aws-route53";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface CertStackDeleteProps extends StackProps {
  hostedZone: HostedZone;
}

export class CertStackDelete extends Stack {
  constructor(scope: App, id: string, props: CertStackDeleteProps) {
    super(scope, id, props);

    const rootDomain = this.node.tryGetContext("rootDomain") as string;

    this.deleteCertRecord(rootDomain, props.hostedZone);
  }

  deleteCertRecord(domain: string, hostedZone: HostedZone): void {
    const provider = new custom_resources.Provider(this, "Provider", {
      onEventHandler: new aws_lambda_nodejs.NodejsFunction(this, "DeleteCertRecord", {
        initialPolicy: [
          new PolicyStatement({
            actions: ["route53:changeResourceRecordSets", "route53:listResourceRecordSets"],
            resources: ["*"],
          }),
        ],
      }),
    });
    void new CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        hostedZoneId: hostedZone.hostedZoneId,
      },
    });
  }
}
