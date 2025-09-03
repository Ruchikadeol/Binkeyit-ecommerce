export const verifyEmailTemplate = ({ name, url }) => `
  <p>Dear ${name},</p>
  <p>Thank you for registering on Binkeyit.</p>
  <p>
    <a href="${url}" 
       style="display:inline-block; padding:10px 20px; background-color:#22c55e; color:white; text-decoration:none; border-radius:5px;">
       Verify Email
    </a>
  </p>
  <p>Regards,<br/>Binkeyit Team</p>
`;
