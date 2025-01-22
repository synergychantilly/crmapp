export const formatBirthday = (dateString) => {
    const options = { month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  export const isBirthdayThisMonth = (birthday) => {
    if (!birthday) return false;
    const now = new Date();
    const birthDate = new Date(birthday);
    return birthDate.getMonth() === now.getMonth();
  };