import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

import * as AWS from 'aws-sdk';

const logger = createLogger('auth')
const secretId = process.env.AUTH_0_SECRET_ID
const secretField = process.env.AUTH_0_SECRET_FIELD

const client = new AWS.SecretsManager();
let cachedSecret: string;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  if(!authHeader){
    throw new Error('No Auth Header In Request')
  }
  if(!authHeader.toLowerCase().startsWith('bearer ')){
    throw new Error('Auth Type Invalid')
  }

  const token = authHeader.split(' ')[1]
  const secrets: any = await readAuth0Secret();
  const SecretString = secrets[secretField]

  return verify(token, SecretString) as JwtPayload
}

async function readAuth0Secret(){
  if(cachedSecret) return cachedSecret;

  const data = await client.getSecretValue({
    SecretId: secretId
  }).promise()

  cachedSecret = JSON.parse(data.SecretString)

  return cachedSecret
}
