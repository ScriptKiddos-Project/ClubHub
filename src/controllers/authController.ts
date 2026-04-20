// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { sendSuccess } from '../utils/response';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.registerUser(req.body);
    sendSuccess(res, user, 'Registration successful. Please check your email to verify your account.', 201);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string };
    const result = await authService.verifyEmail(token);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Set refresh token as HTTP-only cookie
    res.cookie('refresh_token', result.refreshToken, COOKIE_OPTIONS);

    sendSuccess(res, {
      accessToken: result.accessToken,
      user: result.user,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token not found' },
      });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    // Rotate refresh token cookie
    res.cookie('refresh_token', tokens.refreshToken, COOKIE_OPTIONS);

    sendSuccess(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logoutUser(req.user!.id);
    res.clearCookie('refresh_token');
    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    sendSuccess(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    sendSuccess(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function coreJoin(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.coreJoin(req.body);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

// ── Super Admin: Community Management ─────────────────────────────────────────

export async function createCommunity(req: Request, res: Response, next: NextFunction) {
  try {
    const community = await authService.createCommunity({
      ...req.body,
      created_by: req.user!.id,
    });
    sendSuccess(res, community, 'Community created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function generateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await authService.generateCode({
      community_id: id,
      assigned_role: req.body.assigned_role,
      max_uses: req.body.max_uses,
      created_by: req.user!.id,
    });
    sendSuccess(res, result, 'Access code generated');
  } catch (error) {
    next(error);
  }
}

export async function revokeCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await authService.revokeCode(id, req.user!.id);
    sendSuccess(res, null, result.message);
  } catch (error) {
    next(error);
  }
}

export async function getCodeUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const usages = await authService.getCodeUsage(id);
    sendSuccess(res, usages);
  } catch (error) {
    next(error);
  }
}
