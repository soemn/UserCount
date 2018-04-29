require("dotenv").config()
const express = require("express")
const port = 3000
const app = express()
const http = require("http").Server(app)
var AWS = require("aws-sdk")

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  )
  next()
})

AWS.config.update({
  region: "ap-northeast-1",
  credentials: new AWS.Credentials(
    process.env.aws_access_key_id,
    process.env.aws_secret_access_key
  )
})

var rekognition = new AWS.Rekognition()

var params = {
  Video: {
    S3Object: {
      Bucket: "human-rek",
      Name: "output.mp4"
    }
  },
  JobTag: "STRING_VALUE",
  NotificationChannel: {
    RoleArn: "arn:aws:iam::565474084900:role/human-rek" /* required */,
    SNSTopicArn:
      "arn:aws:sns:ap-northeast-1:565474084900:human-tokyo" /* required */
  }
}

const currentTime = new Date()

let response = [
  {
    lat: 1.288332,
    lng: 103.783088,
    count: 0,
    timestamp: currentTime
  }
]

const getResponseDemo = () => {
  return [
    {
      lat: 1.288332,
      lng: 103.783088,
      count: Math.floor(Math.random() * Math.floor(10)),
      timestamp: currentTime
    },
    {
      lat: 1.287942,
      lng: 103.781501,
      count: Math.floor(Math.random() * Math.floor(10)),
      timestamp: currentTime
    },
    {
      lat: 1.289347,
      lng: 103.78404,
      count: Math.floor(Math.random() * Math.floor(10)),
      timestamp: currentTime
    },
    {
      lat: 1.289307,
      lng: 103.779512,
      count: Math.floor(Math.random() * Math.floor(10)),
      timestamp: currentTime
    }
  ]
}

const getNumberOfPeople = data => {
  let largest = -1
  for (let i = 0; i < data.length; i++) {
    if (data[i].Person.Index > largest) {
      largest = data[i].Person.Index
    }
  }

  return largest + 1
}

const getResponse = jobId => {
  const paramsGet = {
    JobId: jobId
  }

  setTimeout(() => {
    rekognition.getPersonTracking(paramsGet, function(err, data) {
      if (err) console.log(err, err.stack)
      else {
        console.log(data)

        if (data.JobStatus === "IN_PROGRESS") {
          getResponse(jobId)
        } else if (data.JobStatus === "SUCCEEDED") {
          const numberOfPeople = getNumberOfPeople(data.Persons)
          // console.log(data.Persons[1])
          console.log(numberOfPeople)
          response.count[0] = numberOfPeople
          startTracking()
          return numberOfPeople
        } else {
          setTimeout(() => {
            startTracking()
          }, 3000)
        }
      }
    })
  }, 5000)
}

const startTracking = () => {
  rekognition.startPersonTracking(params, function(err, data) {
    if (err) console.log(err, err.stack)
    else {
      const jobId = data.JobId
      console.log(data) // successful response
      getResponse(jobId)
    }
  })
}

startTracking()

app.get("/live", (req, res) => {
  res.send(JSON.stringify(response))
})

app.get("/demo", (req, res) => {
  res.send(JSON.stringify(getResponseDemo()))
})

http.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
