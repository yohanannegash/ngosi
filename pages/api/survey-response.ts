import { prisma } from '.prisma/client'
import { SurveyForm } from '@types'
import cuid from 'cuid'
import { nanoid } from 'nanoid'
import { NextApiRequest, NextApiResponse } from 'next'
import { db } from './common/database'

type Data =
  | {
      message: string
    }
  | {
      error: string
    }

export default async function asynchandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const {
      fullName,
      email,
      notificationOfOtherTalks,
      notificationWhenVideoPublished,
      rateMyPresentation,
      presoShortCode
    } = JSON.parse(req.body) as SurveyForm & { presoShortCode: string }

    const preso = await db.preso.findUnique({
      where: { shortCode: presoShortCode }
    })
    if (!preso) {
      res.status(500).json({
        error: `Preso with short code ${presoShortCode} couldn't be found.`
      })
      return
    }

    // lookup attendee
    // create one if they aren't in the db
    const attendee = await db.attendee.create({
      data: {
        id: cuid(),
        email,
        fullName
      }
    })

    const surveyResponse = await db.survey.create({
      data: {
        id: cuid(),
        presoId: preso.id,
        attendeeId: attendee.id,
        notifyOfOtherTalks: notificationOfOtherTalks,
        notifyWhenVideoPublished: notificationWhenVideoPublished,
        sendPresoFeedback: rateMyPresentation
      }
    })

    res.status(200).json({ message: 'ok' })
  } catch (error) {
    const { message } = error as Error
    res.status(500).json({ error: message })
  }
}