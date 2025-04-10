import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      bio: "",
      website: "",
      profileImage: "",
    },
  });
  
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  const onRegisterSubmit = (values: RegisterFormValues) => {
    // Remove confirmPassword as it's not part of the API schema
    const { confirmPassword, ...registrationData } = values;
    registerMutation.mutate(registrationData);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="hidden md:flex flex-col justify-center p-8">
          <h1 className="text-4xl font-bold mb-6">okcode</h1>
          <p className="text-xl mb-6">
            Share your moments, connect with friends, and discover amazing content.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <span className="mr-2 text-primary">✓</span>
              <span>Share photos and videos</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-primary">✓</span>
              <span>Connect with friends</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-primary">✓</span>
              <span>Discover new content</span>
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-primary">✓</span>
              <span>Stay updated with stories</span>
            </li>
          </ul>
        </div>
        
        <div>
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">okcode</CardTitle>
              <CardDescription className="text-center">
                {activeTab === "login" 
                  ? "Sign in to your account" 
                  : "Create a new account"}
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <CardContent className="pt-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="register">
                <CardContent className="pt-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe" 
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="profileImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                name={field.name}
                                ref={field.ref}
                                onBlur={field.onBlur}
                                onChange={field.onChange}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="flex flex-col">
              <div className="mt-4 text-center text-sm">
                {activeTab === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button 
                      onClick={() => setActiveTab("register")}
                      className="text-primary underline"
                    >
                      Register
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button 
                      onClick={() => setActiveTab("login")}
                      className="text-primary underline"
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
