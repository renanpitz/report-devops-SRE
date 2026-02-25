import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="glass-card w-full max-w-md p-6">
        <h1 className="text-xl font-bold text-foreground mb-2 text-center">
          Acessar Status Report Dashboard
        </h1>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          Entre com seu e-mail para gerenciar e salvar seus projetos no banco de dados.
        </p>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#3b82f6",
                  brandAccent: "#2563eb",
                },
              },
            },
          }}
          theme="dark"
        />
      </div>
    </div>
  );
};

export default Login;