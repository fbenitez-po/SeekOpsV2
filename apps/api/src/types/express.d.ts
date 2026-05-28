declare namespace Express {
  interface Request {
    user?: {
      usuario_id: string;
      email: string;
      roles: string[];
      proyectos_ids: string[];
    };
  }
}
