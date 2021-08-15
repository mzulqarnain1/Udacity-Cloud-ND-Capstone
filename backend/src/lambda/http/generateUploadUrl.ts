import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { cors } from 'middy/middlewares'
import * as middy from 'middy'
import { getUserId } from '../utils';
import { getSignedURL, putAttachment } from '../../businessLogic/todos'

const s3Bucket = process.env.ATTACHMENT_S3_BUCKET
const urlExpiry = process.env.SIGNED_URL_EXPIRATION

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId

    const uploadUrl = getSignedURL(s3Bucket, urlExpiry, todoId)
    await putAttachment(userId, todoId, s3Bucket)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl: uploadUrl
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
