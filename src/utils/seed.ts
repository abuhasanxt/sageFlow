import { Role } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
export const seedAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("Admin already exists. Skipping seeding admin");
      return;
    }
    const hashPassword = await bcrypt.hash(envVars.ADMIN_PASSWORD, 12);
    const adminUser = await prisma.user.create({
      data: {
        email: envVars.ADMIN_EMAIL,
        passwordHash: hashPassword,
        name: "Admin Saheb",
        role: Role.ADMIN,
        emailVerified: true,
      },
    });

    console.log("Admin Created", adminUser.email, adminUser.role);
  } catch (error) {
    console.error("Error seeding Admin: ", error);
    await prisma.user.delete({
      where: {
        email: envVars.ADMIN_EMAIL,
      },
    });
  }
};
