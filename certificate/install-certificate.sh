#!/bin/bash
#
# Install certificate for domain at us-east-1 t0 CertificateManager for apigateway and cloudfront edge. 
#
# This script assumes following are installed on the build host:
# - AWS CLI

usage() {
    echo "Usage:"
    echo "    install-certificate.sh -d <domain-name> -h <hosted-zone-id>     Install Certificate to CertificateManager by domain name."
    echo "Example:"
    echo "    install-certificate.sh -d a.tinyurl.tech -h Z000000000000000000"
}

arg_parse() {
    while getopts "d:h:" opt; do
      case ${opt} in
        d )
          DOMAIN_NAME=${OPTARG}
          ;;
        h )
          HOSTED_ZONE_ID=${OPTARG}
          ;;
       \? )
         usage
         exit 1
         ;;
      esac
    done
    shift $((OPTIND -1))

    if [[ -z ${DOMAIN_NAME} ]] || [[ -z ${HOSTED_ZONE_ID} ]]
    then
      usage
      exit 1;
    fi
}

main() {
    arg_parse "$@"
    REGION=$(aws configure get region)
    SET_REGION="aws configure set region"
    echo "Home region: ${REGION}"
    echo "Generating certificate for: ${DOMAIN_NAME} with HostedZoneId ${HOSTED_ZONE_ID}"
    ${SET_REGION} us-east-1
    aws cloudformation deploy \
        --template-file template.yaml \
        --stack-name tinyurl-serverless-certificate \
        --parameter-overrides DomainName=${DOMAIN_NAME} HostedZoneId=${HOSTED_ZONE_ID} \
        --capabilities CAPABILITY_IAM
    ${SET_REGION} ${REGION}
    exit 0
}

# Spin up hook
main "$@"
