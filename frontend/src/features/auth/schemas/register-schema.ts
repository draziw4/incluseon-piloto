import { z } from "zod"

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe seu nome completo").max(255),
    email: z.string().email("Digite um e-mail válido"),
    password: z
      .string()
      .min(12, "A senha precisa ter pelo menos 12 caracteres")
      .max(128),
    passwordConfirmation: z.string(),
    acceptedTerms: z.boolean().refine((accepted) => accepted, {
      message: "Você precisa aceitar os termos e a política de privacidade",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não coincidem",
  })

export type RegisterData = z.infer<typeof registerSchema>
