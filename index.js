const express = require("express")

const app = express()
const port = 8080

//http server, anonimna funckija

app.get("/", (request, response) => {
    response.send("ggara")
})

app.get("/test", (request, response) => {
    response.send("ggara test gas")
})

//aktivacija server

app.listen(port, () => {
    console.log("ggara")
})