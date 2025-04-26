const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client");
const app = express()
const prisma = new PrismaClient()
app.use(cors())
app.use(express.json())

// app.post("/api/create-plan", async (req, res) => {
//     const data = req.body;
//     const createPlan = await prisma.plans.create({
//         data: {
//             billingCycle: data.billingCycle,
//             price: data.price,
//             durationInDays: data.durationInDays
//         }
//     })
//     res.json({
//         data: createPlan
//     })
// })
// app.get("/api/plans", async (req, res) => {
//     const allPlans = await prisma.plans.findMany()
//     res.json({
//         data: allPlans
//     })
// })

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

app.post("/api/settings", async (req, res) => {
    try {
      const data = req.body;
      console.log(data)
  
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

    if (company) {
        const uniqueID = await generateUniqueID(company.companyName, prisma);
    
    const addUser = await prisma.user.create({
        data: {
            userName: data.userName,
            employee_id: uniqueID,
            email: data.email,
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
}})

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
                position: true,
                role: true,
            }
        });

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

app.post('/api/attendance/check-in', async (req, res) => {
    const data = req.body;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    try {
        const existing = await prisma.attendance.findFirst({
            where: {
                user_id: data.user_id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
        console.log(existing)

        if (existing) {
            return res.status(400).json({ message: 'Already checked in today.' });
        }

        const attendance = await prisma.attendance.create({
            data: {
                user_id: data.user_id,
                date: new Date(),
                checkIn: new Date(),
                latitude: data.latitude,
                longitude: data.longitude,
                status: 'PRESENT',
            },
        });

        res.json(attendance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check in.' });
    }
});
// Attendance - Status
app.post('/api/attendance/status', async (req, res) => {
    const { userId } = req.body;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    try {
        const attendanceStatus = await prisma.attendance.findFirst({
            where: {
                userId,
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

        if (!report) {
            return res.status(400).json({ message: 'Work report is required for checkout.' });
        }

        if (!attendance) {
            return res.status(404).json({ message: 'No check-in found for today.' });
        }

        const updated = await prisma.attendance.update({
            where: { attendance_id: attendance.attendance_id }, // ✅ make sure this exists and is used
            data: {
                checkOut: new Date(),
                report: report
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




app.listen(9000, () => {
    console.log(`Wemeet Server Started PortNo:${9000}.....`)
})