export const verifyEmailTemplate = ({ name, url }) => {
  return `
  <p>Dear, ${name} </p>
    <p>Thank you for registering Binkeyit.</p>
    <button style="background-color: #22c55e; padding: 10px; border-radius: 5px;">'
        <a href="${url}" style="color: white; background: blue; text-decoration: none;">Verify Email</a>          
    </button>
    <p>Regards,</p>
    <p>Binkeyit Team</p>
    `;
};
