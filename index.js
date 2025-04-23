const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client");
const app = express()
const prisma = new PrismaClient()
app.use(cors())
app.use(express.json())

app.post("/api/create-plan", async (req, res) => {
    const data = req.body;
    const createPlan = await prisma.plans.create({
        data: {
            billingCycle: data.billingCycle,
            price: data.price,
            durationInDays: data.durationInDays
        }
    })
    res.json({
        data: createPlan
    })
})
app.get("/api/plans", async (req, res) => {
    const allPlans = await prisma.plans.findMany()
    res.json({
        data: allPlans
    })
})

app.listen(9000, () => {
    console.log("WEMEET SERVER STARTED.........")
})