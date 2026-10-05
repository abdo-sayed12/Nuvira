import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_localization.dart';
import '../theme/app_theme.dart';

class AuthView extends StatefulWidget {
  final String lang;
  final void Function(String name, String email) onAuthenticated;

  const AuthView({
    super.key,
    required this.lang,
    required this.onAuthenticated,
  });

  @override
  State<AuthView> createState() => _AuthViewState();
}

class _AuthViewState extends State<AuthView> {
  bool _isLogin = true;
  bool _loading = false;
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  String? _errorMsg;

  Future<void> _submit() async {
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    final email = _emailCtrl.text.trim().toLowerCase();
    final pass = _passCtrl.text.trim();
    final name = _nameCtrl.text.trim();

    if (email.isEmpty || !email.contains('@') || pass.length < 4) {
      setState(() => _errorMsg = t('auth_err_empty'));
      return;
    }
    if (!_isLogin && pass != _confirmCtrl.text.trim()) {
      setState(() => _errorMsg = t('auth_err_match'));
      return;
    }

    setState(() {
      _loading = true;
      _errorMsg = null;
    });

    try {
      final user = await ApiService.authenticateUser(
        isLogin: _isLogin,
        email: email,
        password: pass,
        fullName: name.isEmpty ? null : name,
      );

      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emerald,
            content: Text(t('auth_success')),
          ),
        );
        widget.onAuthenticated(user['name']!, user['email']!);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMsg = widget.lang == 'ar'
              ? 'بيانات الدخول غير صحيحة أو الحساب غير مسجل بعد (قم بإنشاء حساب أولاً)'
              : 'Invalid email or password (please create an account first if not registered)';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = (String k) => AppLocalization.tr(widget.lang, k);
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 420),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: AppTheme.webCardGradient,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.turquoise.withOpacity(0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                'assets/images/logo.png',
                width: 58,
                height: 58,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.health_and_safety,
                  size: 58,
                  color: AppTheme.turquoise,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                t('appName'),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                t('auth_subtitle'),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 12.5),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppTheme.spaceNavy,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _isLogin = true;
                          _errorMsg = null;
                        }),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            gradient: _isLogin ? AppTheme.emeraldButtonGradient : null,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            t('sign_in'),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() {
                          _isLogin = false;
                          _errorMsg = null;
                        }),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            gradient: !_isLogin ? AppTheme.emeraldButtonGradient : null,
                            borderRadius: BorderRadius.circular(11),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            t('sign_up'),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              if (!_isLogin) ...[
                _field(_nameCtrl, t('full_name'), Icons.person_outline),
                const SizedBox(height: 12),
              ],
              _field(_emailCtrl, t('email'), Icons.email_outlined),
              const SizedBox(height: 12),
              _field(_passCtrl, t('password'), Icons.lock_outline, obscure: true),
              if (!_isLogin) ...[
                const SizedBox(height: 12),
                _field(_confirmCtrl, t('confirm_pass'), Icons.verified_user_outlined, obscure: true),
              ],
              if (_errorMsg != null) ...[
                const SizedBox(height: 12),
                Text(
                  _errorMsg!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.dangerRed, fontSize: 12.5),
                ),
              ],
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.lightEmerald,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _isLogin ? t('sign_in') : t('sign_up'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String hint, IconData icon, {bool obscure = false}) {
    return TextField(
      controller: c,
      obscureText: obscure,
      onSubmitted: (_) => _submit(),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: AppTheme.turquoise, size: 20),
        hintText: hint,
        filled: true,
        fillColor: AppTheme.spaceNavy,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.turquoise),
        ),
      ),
    );
  }
}
