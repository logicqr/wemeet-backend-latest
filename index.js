const express = require("express")
const cors = require("cors")
const cron = require('node-cron');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client");
const app = express()
const prisma = new PrismaClient()
app.use(cors())
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString(); // Store raw body as a string
    }
  }));
const razorpay = new Razorpay({
    key_id: 'rzp_test_Zx80R4WBqXOtJR',
    key_secret: 'k97PIEuZ1u7FC3cPe1LP5Pe4'
})

// create plan , update , get.............................................

app.post("/api/create-plan", async (req, res) => {
    const data = req.body;
    const createPlan = await prisma.plans.create({
        data: {
            name: data.name,
            amount: data.amount,
            duration: data.duration,
            type: data.type
        }
    })
    res.json({
        data: createPlan
    })
})

app.get("/api/plans/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await prisma.plans.findUnique({
            where: { plan_id: id }
        });

        if (!plan) {
            return res.status(404).json({ error: "Plan not found" });
        }

        res.status(200).json({ data: plan });
    } catch (error) {
        console.error("Error fetching plan:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update Plan by ID
app.put("/api/update-plan/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPlan = await prisma.plans.update({
            where: { plan_id: id },
            data: {
                name: data.name,
                amount: data.amount,
                duration: data.duration,
                type: data.type
            }
        });

        res.status(200).json({ data: updatedPlan });
    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ error: "Could not update plan" });
    }
});

app.get("/api/plans", async (req, res) => {
    const allPlans = await prisma.plans.findMany()
    res.json({
        data: allPlans
    })
})

//.............................................

app.post('/api/order', async (req, res) => {
    const data = req.body;
    console.log(data)

    const order = await razorpay.orders.create({
        amount: data.amount * 100,
        currency: "INR",
        
    })
    console.log(order)

    const tempStore = await prisma.tempOrder.create({
        data: {
            companyName: data.companyName,
            userName: data.userName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            position: data.position,
            password: data.password,
            plan_id: data.plan_id,
            razorpayOrderId: order.id
        }
    })
    res.status(200).json({ success: true, order });
})


// app.post('/payment-verify') = async (req, res) => {
//     try {
//         console.log('🔹 Webhook Received!');

//         const webhookBody = req.rawBody;
//         if (!webhookBody) {
//             console.log('❌ Missing Raw Body!');
//             return res.status(400).json({ message: 'Invalid webhook request' });
//         }

//         const webhookSecret = config.RAZORPAY_KEY_SECRET;
//         const webhookSignature = req.headers['x-razorpay-signature'];

//         console.log('🔹 Received Signature:', webhookSignature);
//         console.log('🔹 Expected Secret:', webhookSecret);

//         if (!webhookSecret || !webhookSignature) {
//             console.log('❌ Missing Secret or Signature');
//             return res.status(400).json({ message: 'Invalid webhook request' });
//         }

//         // Verify Signature
//         const expectedSignature = crypto
//             .createHmac('sha256', webhookSecret)
//             .update(webhookBody) // Ensure raw body is used
//             .digest('hex');

//         console.log('🔹 Computed Signature:', expectedSignature);

//         if (expectedSignature !== webhookSignature) {
//             console.log('❌ Invalid Signature!');
//             return res.status(400).json({ message: 'Invalid webhook signature' });
//         }

//         // Parse Webhook Event
//         const event = JSON.parse(webhookBody);


//         switch (event.event) {
//             case "payment.captured": {
//                 const paymentDetails = event.payload.payment.entity;
//                 const orderId = paymentDetails.order_id;
//                 const paymentId = paymentDetails.id;
//                 const amount = paymentDetails.amount / 100;

//                 console.log("✅ Payment Captured:", { orderId, paymentId, amount });

//                 // Check if it's a Subscription Renewal
//                 const renewal = await prisma.revenue.findUnique({ where: { orderId } });

//                 if (renewal) {
//                     const updatedUser = await prisma.user.update({
//                         where: { user_id: renewal.user_id },
//                         data: {

//                             // subscriptionStartDate: new Date(), // Current time
//                             // subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
//                             // subscriptionStartDate: new Date(), // Set to the current time
//                             // subscriptionEndDate: new Date(Date.now() + 5 * 60 * 1000), // Extend by 2 minutes
//                             subscriptionStartDate: new Date(), // Current time
//                             subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
//                             isActive: true // Set to true
//                         },
//                     });





//                     console.log("✅ Subscription Renewed:", updatedUser);


//                     const transaction = await prisma.transaction.create({
//                         data: {
//                             user_id: updatedUser.user_id,
//                             userName: updatedUser.name,
//                             orderId,
//                             paymentId,
//                             employee_id: updatedUser.employee_id,
//                             amount,
//                             status: "paid",
//                             type: "Subscription Repaid",
//                         },
//                     })
//                     await prisma.revenue.update({
//                         where: { orderId },
//                         data: { status: "paid" },
//                     }),

//                         await sendRenewalInvoiceEmail(transaction.transaction_id, updatedUser.email, updatedUser.name, paymentId, orderId, amount, updatedUser.subscriptionStartDate, updatedUser.subscriptionEndDate);

//                     console.log("✅ Revenue Recorded for Renewal");
//                     return res.status(200).json({ message: "Subscription renewed successfully" });
//                 }

//                 const tempOrder = await prisma.temporder.findUnique({ where: { orderId } });

//                 if (!tempOrder) {
//                     console.log("❌ Temp Order Not Found!");
//                     return res.status(404).json({ message: "Temporary order not found" });
//                 }

//                 // Extract Referral Code
//                 let referralCode = tempOrder.referralCode;
//                 const defaultReferralCode = "WZ25MAR11-7657";
//                 const referralSources = ["Google", "Facebook", "Instagram"];

//                 if (referralSources.includes(referralCode)) {
//                     referralCode = defaultReferralCode;
//                 }

//                 console.log('🔹 Referral Code:', referralCode);

//                 // Find Staff using Referral Code
//                 const staff = await prisma.employees.findUnique({ where: { referralCode } });
//                 console.log("employee_id", staff.employee_id)

//                 if (!staff) {
//                     console.log('❌ Invalid Referral Code!');
//                     return res.status(404).json({ message: "Invalid Referral Code" });
//                 }

//                 console.log('🔹 Found Staff:', staff);
//                 console.log("employee_id", staff.employee_id);

//                 // Hash Password (Ensure you installed bcrypt: npm install bcrypt)
//                 // const bcrypt = require('bcrypt');
//                 // const hashedPassword = await bcrypt.hash(tempOrder.password, 10);

//                 // Create New User
//                 const newUser = await prisma.user.create({
//                     data: {
//                         name: tempOrder.fullName,
//                         email: tempOrder.email,
//                         phoneNumber: tempOrder.phone,
//                         password: tempOrder.password,  // Secure password storage
//                         placeId: tempOrder.placeId,
//                         businessName: tempOrder.businessName,
//                         businessType: tempOrder.businessType,
//                         referralCode: tempOrder.referralCode,
//                         employee_id: staff.employee_id,
//                         isActive: true,
//                         subscriptionStartDate: new Date(), // Current time
//                         subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
//                         // subscriptionStartDate: new Date(),
//                         // subscriptionEndDate: new Date(Date.now() + 5 * 60 * 1000), // 2 minutes from now
//                         // subscriptionStartDate: new Date(), // Current time
//                         // subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
//                     }
//                 });

//                 console.log("✅ New User Created:", newUser);

//                 const dashboard = await prisma.dashboard.create({
//                     data: { user_id: newUser.user_id },
//                 });

//                 console.log('✅ New User Created:', dashboard);

//                 // Create Transaction Record
//                 const transaction = await prisma.transaction.create({
//                     data: {
//                         user_id: newUser.user_id,
//                         userName: newUser.name,
//                         employee_id: newUser.employee_id,
//                         orderId,
//                         paymentId,
//                         amount,
//                         status: "paid",
//                         type: "Signup",
//                     },
//                 });

//                 console.log('✅ Transaction-Recorded', transaction);



//                 // Transaction Handling
//                 // await prisma.$transaction([
//                 //     prisma.dashboard.create({ data: { user_id: newUser.user_id } }),
//                 //     prisma.transaction.create({
//                 //         data: {
//                 //             user_id: newUser.user_id,
//                 //             userName: newUser.name,
//                 //             orderId,
//                 //             paymentId,
//                 //             amount,
//                 //             status: "paid",
//                 //             type: "Signup",
//                 //         },
//                 //     }),
//                 //     prisma.temporder.delete({ where: { orderId } }),
//                 // ]);

//                 // Delete Temp Order
//                 await prisma.temporder.delete({ where: { orderId } });
//                 console.log('✅ Temp Order Deleted');

//                 // Send Invoice Email
//                 await sendInvoiceEmail(transaction.transaction_id, newUser.name, newUser.email, orderId, paymentId, amount, newUser.subscriptionStartDate, newUser.subscriptionEndDate);

//                 console.log("✅ Transaction Recorded & Temp Order Deleted");
//                 return res.status(200).json({ message: `${newUser.name} has been registered successfully` });
//             }

//             case "payment.failed": {
//                 console.log("❌ Payment Failed:", event.payload.payment.entity);
//                 return res.status(200).json({ message: "Payment failed event logged" });
//             }

//             default:
//                 console.log("⚠️ Unhandled Event Type:", event.event);
//                 return res.status(200).json({ message: "Unhandled event" });
//         }
//     } catch (error) {
//         console.error("🔥 Webhook Processing Error:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };
app.post("/webhook", async (req, res) => {
    try {
        console.log('🔹 Webhook Received!');

        const webhookBody = req.rawBody;
        if (!webhookBody) {
            console.log('❌ Missing Raw Body!');
            return res.status(400).json({ message: 'Invalid webhook request' });
        }

        const webhookSecret = "k97PIEuZ1u7FC3cPe1LP5Pe4";
        const webhookSignature = req.headers['x-razorpay-signature'];

        console.log('🔹 Received Signature:', webhookSignature);
        console.log('🔹 Expected Secret:', webhookSecret);

        if (!webhookSecret || !webhookSignature) {
            console.log('❌ Missing Secret or Signature');
            return res.status(400).json({ message: 'Invalid webhook request' });
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody) // Ensure raw body is used
            .digest('hex');

        console.log('🔹 Computed Signature:', expectedSignature);

        if (expectedSignature !== webhookSignature) {
            console.log('❌ Invalid Signature!');
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        // Parse Webhook Event
        const event = JSON.parse(webhookBody);


        switch (event.event) {
            case "payment.captured": {
                const paymentDetails = event.payload.payment.entity;
                const orderId = paymentDetails.order_id;
                const paymentId = paymentDetails.id;
                const amount = paymentDetails.amount / 100;

                console.log("✅ Payment Captured:", { orderId, paymentId, amount });

                const isExistingTempOrder = await prisma.tempOrder.findUnique({
                    where: { razorpayOrderId: orderId }
                });
        
                if (!isExistingTempOrder) {
                    return res.status(404).json({ message: "Temp order not found" });
                }
        
                // 1. Create company
                const company = await prisma.company.create({
                    data: { companyName: isExistingTempOrder.companyName }
                });
        
                // 2. Create user (SUPER_ADMIN)
                const user = await prisma.user.create({
                    data: {
                        userName: isExistingTempOrder.userName,
                        email: isExistingTempOrder.email,
                        phoneNumber: isExistingTempOrder.phoneNumber,
                        position: isExistingTempOrder.position,
                        password: isExistingTempOrder.password,
                        role: "SUPER_ADMIN",
                        company_id: company.company_id
                    }
                });
        
                // 3. Create subscription
                const plan = await prisma.plans.findUnique({
                    where: { plan_id: isExistingTempOrder.plan_id }
                });
        
                const now = new Date();
                const end = new Date(now);
                end.setDate(end.getDate() + plan.duration);
        
                await prisma.subscription.create({
                    data: {
                        company_id: company.company_id,
                        plan_id: plan.plan_id,
                        startDate: now,
                        endDate: end,
                        isActive: true
                    }
                });
        
                // 4. Optionally, delete temp order
                await prisma.tempOrder.delete({
                    where: { razorpayOrderId: orderId}
                });
        
                res.json({
                    message: `Payment verified and registration completed`
                });
                
            }

            case "payment.failed": {
                console.log("❌ Payment Failed:", event.payload.payment.entity);
                return res.status(200).json({ message: "Payment failed event logged" });
            }

            default:
                console.log("⚠️ Unhandled Event Type:", event.event);
                return res.status(200).json({ message: "Unhandled event" });
        }
    } catch (error) {
        console.error("🔥 Webhook Processing Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})


// app.post('/payment-verify', async (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     // Optional: Verify the payment signature
//     const hmac = crypto.createHmac("sha256", "YOUR_SECRET");
//     hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//     const generatedSignature = hmac.digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//         return res.status(400).json({ message: "Invalid signature" });
//     }

//     try {
       

//     } catch (error) {
//         console.error("Payment verification error:", error);
//         res.status(500).json({ error: "Something went wrong during verification" });
//     }
// });

app.post("/api/register", async (req, res) => {
    const data = req.body;
    const isExistingUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })
    if (isExistingUser) {
        return res.status(400).json({ message: "This email is already registered. Please use a different one." });
    }
    const companyName = await prisma.company.create({
        data: {
            companyName: data.companyName,
        }
    })
    const companyRegister = await prisma.user.create({
        data: {
            userName: data.userName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            position: data.position,
            password: data.password,
            role: "SUPER_ADMIN",
            company_id: companyName.company_id
        }
    })
    res.json({
        data: {
            message: `Registration successful! Welcome aboard, ${companyRegister.userName}.`
        }
    })
})

app.post("/api/login", async (req, res) => {
    const data = req.body;
    const isExistingUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })
    if (isExistingUser) {
        if (isExistingUser.password === data.password) {
            var accessToken = jwt.sign({
                user_id: isExistingUser.user_id,
                role: isExistingUser.role
            }, 'jaromjery',
                { expiresIn: "24h" });

            var refreshToken = jwt.sign({
                user_id: isExistingUser.user_id,
                role: isExistingUser.role
            }, 'jaromjery',
                { expiresIn: "7d" });

            await prisma.token.create({
                data: {
                    refreshToken: refreshToken
                }
            })

            return res.status(200).json({
                message: "Login successful",
                data: {
                    accessToken,
                    refreshToken
                }
            });
        } else {
            return res.status(401).json({ message: "Incorrect password" });
        }
    } else {
        return res.status(404).json({ message: "User not found" });
    }
})

app.post("/api/refresh", async (req, res) => {
    const data = req.body;
    const tokenValid = await prisma.token.findFirst({
        where: {
            refreshToken: data.refreshToken
        }
    })
    if (tokenValid) {
        jwt.verify(tokenValid.refreshToken, 'jaromjery', function (err, decoded) {
            if (!err) {
                var accessToken = jwt.sign({
                    user_id: tokenValid.user_id,
                    role: decoded.role
                }, 'jaromjery',
                    { expiresIn: "24h" });
                return res.json({
                    accessToken: accessToken
                })
            } else {
                return res.json({
                    message: "Token is Invalid"
                })
            }
        });
    } else {
        return res.json({
            message: "Token Not Found"
        })
    }
})

app.put("/api/settings", async (req, res) => {
    try {
        const data = req.body;

        const updateSettings = await prisma.company.update({
            where: {
                company_id: data.company_id,
            },
            data: {
                officeLatitude: data.officeLatitude,  // <-- Corrected
                officeLongitude: data.officeLongitude,
                allowedRadius: data.allowedRadius,
            },
        });

        res.status(200).json({
            message: "Company settings updated successfully!",
            company: updateSettings
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
});


// utils/generateUniqueID.js
async function generateUniqueID(companyName, prisma) {
    const vowels = ['A', 'E', 'I', 'O', 'U'];

    const firstLetter = companyName[0]?.toUpperCase() || '';
    let secondLetter = '';
    for (let i = 1; i < companyName.length; i++) {
        const letter = companyName[i]?.toUpperCase();
        if (letter && !vowels.includes(letter)) {
            secondLetter = letter;
            break;
        }
    }

    const year = new Date().getFullYear().toString().slice(-2);
    let employee_id;
    let exists = true;

    while (exists) {
        const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
        employee_id = `${firstLetter}${secondLetter}${year}${randomDigits}`;

        const existingUser = await prisma.user.findFirst({
            where: { employee_id }
        });

        if (!existingUser) {
            exists = false; // unique ID found
        }
    }

    return employee_id;
}
// // Example usage
// console.log(generateUniqueID("jaromjery",prisma)); 

app.post("/api/add-user", async (req, res) => {
    const data = req.body;
    console.log(data)
    const isExistingUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })
    if (isExistingUser) {
        return res.status(400).json({ message: "User Already Exists" });
    }

    const company = await prisma.company.findUnique({
        where: { company_id: data.company_id }
    });
    console.log(company)
    if (company) {
        const uniqueID = await generateUniqueID(company.companyName, prisma);

        const addUser = await prisma.user.create({
            data: {
                userName: data.userName,
                employee_id: uniqueID,
                email: data.email,
                phoneNumber: data.phoneNumber,
                department: data.department,
                position: data.position,
                password: data.password,
                mode: data.mode,
                role: data.role,
                company_id: data.company_id
            }
        })
        const { password, ...userWithoutPassword } = addUser;

        res.json({
            data: userWithoutPassword
        })
    }
})

app.post("/api/all-users", async (req, res) => {
    try {
        const data = req.body;
        if (!data.company_id) {
            return res.status(400).json({ error: "companyId is required" });
        }
        const getAllUsers = await prisma.user.findMany({
            where: {
                company_id: data.company_id,

            },
            select: {
                user_id: true,
                userName: true,
                department: true,
                position: true,
                role: true,
            }
        });

        console.log(getAllUsers)

        res.json(getAllUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// one problem the create userid is not mentioned
app.post("/api/create-meeting", async (req, res) => {
    try {
        const data = req.body;
        const participantIds = data.participantIds;
        const meeting = await prisma.meeting.create({
            data: {
                title: data.title,
                description: data.description,
                scheduledAt: data.scheduledAt,
                link: data.link,
                user_id: data.user_id,
                // createdBy:user.userName,
                // createdPosition:user.position,
                meetingParticipant: {
                    create: participantIds.map((participantId) => ({
                        user: { connect: { user_id: participantId } }
                    }))
                }
            },
            include: {
                meetingParticipant: {
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                userName: true,
                                email: true,
                                position: true,
                                role: true,
                                company_id: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error("Error creating meeting:", error);
        res.status(500).json({ error: "Failed to create meeting" });
    }
});

app.post("/api/my-meetings", async (req, res) => {
    try {
        const { user_id } = req.body; // or req.user if using auth middleware

        const meetings = await prisma.meeting.findMany({
            where: {
                meetingParticipant: {
                    some: { user_id } // You were added to it
                }
            },
            orderBy: {
                scheduledAt: "desc"
            },
            include: {
                user: {
                    select: {
                        user_id: true,
                        userName: true,
                        email: true,
                        position: true,
                        role: true,
                        company_id: true
                    }
                }
            }
        });

        res.json(meetings);
    } catch (error) {
        console.error("Failed to get user meetings:", error);
        res.status(500).json({ error: "Failed to get meetings" });
    }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers

}
app.post('/api/check-in', async (req, res) => {
    try {
        const { user_id, currentLongitude, currentLatitude } = req.body;

        if (!user_id || !currentLongitude || !currentLatitude) {
            return res.status(400).json({ message: "User ID and location are required" });
        }

        const user = await prisma.user.findUnique({
            where: { user_id: user_id },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked-in today
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                user_id: user_id,
                date: today,
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: "Already checked-in today" });
        }

        if (user.mode === "work_from_home") {
            const attendance = await prisma.attendance.create({
                data: {
                    user_id: user.user_id,
                    date: new Date(),
                    checkIn: new Date(),
                    latitude: parseFloat(currentLatitude),
                    longitude: parseFloat(currentLongitude),
                    status: "PRESENT",
                    report: "Work from home"
                }
            });

            return res.json({
                message: "Check-in successful for Work From Home",
                data: attendance
            });
        }

        if (user.mode === "work_from_office") {
            const company = await prisma.company.findUnique({
                where: { company_id: user.company_id }
            });

            if (!company || !company.officeLatitude || !company.officeLongitude) {
                return res.status(400).json({ message: "Company office location not set" });
            }

            const distance = calculateDistance(
                parseFloat(currentLatitude),
                parseFloat(currentLongitude),
                company.officeLatitude,
                company.officeLongitude
            );
            const distanceInMeters = distance * 1000;
            // console.log(distanceInMeters)

            if (distanceInMeters > company.allowedRadius) {
                return res.status(400).json({
                    message: `Check-In failed. You are ${Math.round(distanceInMeters)} meters away, allowed is ${company.allowedRadius} meters.`
                });
            }

            const attendance = await prisma.attendance.create({
                data: {
                    user_id: user.user_id,
                    date: new Date(),
                    checkIn: new Date(),
                    latitude: parseFloat(currentLatitude),
                    longitude: parseFloat(currentLongitude),
                    status: "PRESENT",
                    report: "Checked in at office"
                }
            });

            return res.json({
                message: "Check-in successful at office",
                data: attendance
            });
        }

        res.status(400).json({ message: "Invalid work mode" });

    } catch (error) {
        console.error("Check-in error:", error);
        res.status(500).json({ message: "Server error during check-in" });
    }
});


// Attendance - Status
app.post('/api/attendance/status', async (req, res) => {
    const data = req.body;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    try {
        const attendanceStatus = await prisma.attendance.findFirst({
            where: {
                user_id: data.user_id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        res.json({ attendanceStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get status.' });
    }
});
// Attendance - Check-out
app.post('/api/attendance/check-out', async (req, res) => {
    const data = req.body;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    try {
        const attendance = await prisma.attendance.findFirst({
            where: {
                user_id: data.user_id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });


        if (!data.report) {
            return res.status(400).json({ message: 'Work report is required for checkout.' });
        }

        if (!attendance) {
            return res.status(404).json({ message: 'No check-in found for today.' });
        }


        const updated = await prisma.attendance.update({
            where: { attendance_id: attendance.attendance_id }, // ✅ make sure this exists and is used
            data: {
                checkOut: new Date(),
                report: data.report
            },
        });



        res.json({ message: "Checkout successful.", data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check out.' });
    }
});

app.post('/api/leave-request', async (req, res) => {
    const data = req.body;

    const createLeaveRequest = await prisma.leaveRequest.create({
        data: {
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason,
            user_id: data.user_id
        }
    })

    res.json({
        data: createLeaveRequest
    })
})

app.post('/api/leave-request/update-status', async (req, res) => {
    const data = req.body;

    try {
        const updatedLeave = await prisma.leaveRequest.update({
            where: {
                leave_id: data.leave_id
            },
            data: {
                status: data.status,
                approvedBy: data.approvedBy, // optional, include only if relevant
            },
        });

        res.json({ message: 'Leave request status updated successfully', data: updatedLeave });
    } catch (error) {
        res.status(400).json({ error: 'Failed to update status', details: error.message });
    }
});

app.get("/api/leave-request", async (req, res) => {
    const adminLeaveRequest = await prisma.leaveRequest.findMany()
    res.json({
        adminLeaveRequest
    })
})

app.get("/api/admin-leave-request", async (req, res) => {
    try {
        const LeaveRequests = await prisma.leaveRequest.findMany({
            where: {
                user: {
                    role: 'ADMIN'
                }
            },
            include: {
                user: {
                    select: {
                        userName: true,
                        position: true,
                        role: true
                    }
                }
            }, orderBy: {
                createdAt: 'desc' // optional sorting
            }
        });

        res.json({ LeaveRequests });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch admin leave requests" });
    }
});

app.get("/api/leave-request/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
        const leaveStatus = await prisma.leaveRequest.findMany({
            where: {
                user_id: user_id, // use correct field name from schema
            }, orderBy: {
                createdAt: 'desc',
            }

        });

        res.json({ data: leaveStatus });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch leave requests", details: error.message });
    }
});

app.get("/api/staff-leave-request", async (req, res) => {
    try {
        const LeaveRequests = await prisma.leaveRequest.findMany({
            where: {
                user: {
                    role: 'STAFF'
                }
            },
            include: {
                user: {
                    select: {
                        userName: true,
                        position: true,
                        role: true
                    }
                }
            }
        });

        res.json({ LeaveRequests });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch staff leave requests" });
    }
});

app.get('/api/user-report/:userId', async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
    }

    try {
        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);

        const userReport = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                userName: true,
                email: true,
                position: true,
                department: true,
                attendance: {
                    where: {
                        date: {
                            gte: fromDate,
                            lte: toDate,
                        },
                    },
                    select: {
                        attendance_id: true,
                        date: true,
                        checkIn: true,
                        checkOut: true,
                        latitude: true,
                        longitude: true,
                        status: true,
                        report: true,
                    },
                },
                leaveRequest: {
                    where: {
                        OR: [
                            {
                                startDate: { gte: startDate, lte: endDate },
                            },
                            {
                                endDate: { gte: startDate, lte: endDate },
                            },
                            {
                                startDate: { lte: startDate },
                                endDate: { gte: endDate },
                            }
                        ],
                    },
                    select: {
                        leave_id: true,
                        startDate: true,
                        endDate: true,
                        reason: true,
                        status: true,
                        approvedBy: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!userReport) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(userReport);

    } catch (error) {
        console.error("Error fetching user report:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.get('/api/company', async (req, res) => {
    try {
        const getAllUser = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN',
            },
            select: {
                userName: true,
                email: true,
                company: {
                    select: {
                        companyName: true,
                    }
                }
            }
        });
        res.json(getAllUser);
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});







// cron.schedule('* * * * *', async () => {

app.post("/jaromjery", async (req, res) => {

    console.log('⏰ Running attendance cron job');
    try {
        const users = await prisma.user.findMany();

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to 12:00 AM of today
        console.log(today)

        const attendanceData = users.map(user => ({
            user_id: user.user_id,
            date: today,
            status: 'ABSENT',
            checkIn: null,
            checkOut: null
        }));

        await prisma.attendance.createMany({
            data: attendanceData,
            skipDuplicates: true,
        });

        console.log('✅ Attendance created for all users');
    } catch (error) {
        console.error('❌ Error in cron job:', error);
    }
    // });

})



app.listen(9000, () => {
    console.log(`Wemeet Server Started PortNo:${9000}.....`)
})