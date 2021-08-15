import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'
import { v4 as uuidv4 } from 'uuid'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)
    const todoId = uuidv4()

    const newToDo = {
      todoId: todoId,
      userId: userId,
      ...newTodo
    }
    await createTodo(newToDo, userId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newToDo
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)
