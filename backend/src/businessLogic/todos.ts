import * as AWS from 'aws-sdk';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

export async function getTodosForUser(userId: string){
  const result = await docClient.query({
    TableName: todosTable,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  }).promise()

  return result.Items
}

export async function putAttachment(userId, todoId, s3Bucket){
  await docClient.update({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    },
    UpdateExpression: "set attachmentUrl = :attachmentUrl",
    ExpressionAttributeValues: {
      ":attachmentUrl": `https://${s3Bucket}.s3.amazonaws.com/${todoId}`
    }
  }).promise()
}

export async function createTodo(newTodo: object, userId: string){
  await docClient.put({
    TableName: todosTable,
    Item: newTodo
  }).promise()
}

export function getSignedURL(bucket: string, expiry: string, todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucket,
    Key: todoId,
    Expires: parseInt(expiry)
  })
}

export async function deleteTodo(userId: string, todoId: string){
  await docClient.delete({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    }
  }).promise()
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest){
  await docClient.update({
    TableName: todosTable,
    Key: {
      userId: userId,
      todoId: todoId
    },
    UpdateExpression: "set #name = :n, #dueDate = :due, #done = :don",
    ExpressionAttributeNames: {
      "#name": "name",
      "#dueDate": "dueDate",
      "#done": "done",
    },
    ExpressionAttributeValues: {
      ":n": updatedTodo.name,
      ":due": updatedTodo.dueDate,
      ":don": updatedTodo.done
    },
  }).promise()
}
