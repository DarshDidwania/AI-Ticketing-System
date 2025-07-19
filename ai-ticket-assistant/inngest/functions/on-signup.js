import { inngest } from "../client.js";
import  User  from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";

export const onUserSignup = inngest.createFunction(
    {id: "on-user-signup", retries: 2},
    {event: "user.signup"},
    async ({event, step}) => {
        try{
            const {email} = event.data
            const user=await step.run("get-user-email", async () => {
            const userObject = await User.findOne({email});
            if(!userObject){
                throw new NonRetriableError(`User with email ${email} not found`);
            }
            return userObject
        })

        await step.run("send-welcome-email", async () => {
            const subject = "Welcome to the Ticketing System";
            const message = `Hello ${user.email},\n\nThank you for signing up! We're excited to have you on board.\n\nBest regards,\nTicketing System Team`;
            await sendMail(user.email, subject, message);
        })
        return {success:true}
    } catch(error) {
        console.error("Error running steps:", error.message)
        return {success:false}
    }
    }
);