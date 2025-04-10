import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { PlusSquare, Image, Film, ArrowLeft, X, MapPin, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

// Extend the post schema for the form
const postFormSchema = z.object({
  caption: z.string().max(2200, "Caption cannot exceed 2200 characters"),
  location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
});

// Extend the reel schema for the form
const reelFormSchema = z.object({
  caption: z.string().max(2200, "Caption cannot exceed 2200 characters").optional(),
  duration: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;
type ReelFormValues = z.infer<typeof reelFormSchema>;

export default function CreatePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("post");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Forms for post and reel creation
  const postForm = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      caption: "",
      location: "",
    },
  });
  
  const reelForm = useForm<ReelFormValues>({
    resolver: zodResolver(reelFormSchema),
    defaultValues: {
      caption: "",
      duration: "",
    },
  });
  
  // Check user preference when page loads
  useEffect(() => {
    const userPreference = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (userPreference === 'dark' || (!userPreference && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    setIsDarkMode(isDark);
  };
  
  // Handle file selection for post (image)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle file selection for reel (video)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 20MB",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle file selection for thumbnail
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file for the thumbnail",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear all selections and form data
  const handleCancel = () => {
    if (activeTab === "post") {
      setImagePreview(null);
      postForm.reset();
    } else {
      setVideoPreview(null);
      setThumbnailPreview(null);
      reelForm.reset();
    }
  };
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/posts', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create reel mutation
  const createReelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/reels', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reel created!",
        description: "Your reel has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reels'] });
      setLocation('/reels');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create reel",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle post submission
  const onPostSubmit = async (values: PostFormValues) => {
    if (!imagePreview) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get the file from the input ref
      const imageFile = imageInputRef.current?.files?.[0];
      if (!imageFile) throw new Error("Image file not found");
      
      // Create form data for submission
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('caption', values.caption);
      if (values.location) formData.append('location', values.location);
      
      // Submit the form data
      createPostMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading your post",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle reel submission
  const onReelSubmit = async (values: ReelFormValues) => {
    if (!videoPreview) {
      toast({
        title: "No video selected",
        description: "Please select a video to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Get the files from the input refs
      const videoFile = videoInputRef.current?.files?.[0];
      const thumbnailFile = thumbnailInputRef.current?.files?.[0];
      
      if (!videoFile) throw new Error("Video file not found");
      
      // Create form data for submission
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (values.caption) formData.append('caption', values.caption);
      if (values.duration) formData.append('duration', values.duration);
      
      // Submit the form data
      createReelMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading your reel",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Create New</h1>
          
          <Tabs defaultValue="post" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="post" disabled={isUploading}>
                <Image className="h-4 w-4 mr-2" />
                Post
              </TabsTrigger>
              <TabsTrigger value="reel" disabled={isUploading}>
                <Film className="h-4 w-4 mr-2" />
                Reel
              </TabsTrigger>
            </TabsList>
            
            {/* POST CREATION */}
            <TabsContent value="post">
              {!imagePreview ? (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                  <PlusSquare className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                  <h2 className="text-xl font-semibold mb-2">Create a Post</h2>
                  <p className="text-neutral-500 mb-6">Share your photos with your followers</p>
                  
                  <input 
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <div className="inline-flex cursor-pointer">
                      <Button className="pointer-events-none">
                        <Image className="h-4 w-4 mr-2" />
                        Select Image
                      </Button>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700">
                  <div className="border-b border-neutral-300 dark:border-neutral-700 p-4 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <h2 className="text-lg font-semibold">Create Post</h2>
                    <Button 
                      size="sm" 
                      onClick={postForm.handleSubmit(onPostSubmit)}
                      disabled={isUploading || createPostMutation.isPending}
                    >
                      Share
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 bg-black flex items-center justify-center p-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-w-full max-h-[50vh] md:max-h-[70vh] object-contain"
                      />
                    </div>
                    
                    <div className="md:w-1/2 p-4">
                      <div className="mb-4">
                        <Textarea
                          placeholder="Write a caption..."
                          className="resize-none"
                          {...postForm.register("caption")}
                        />
                        {postForm.formState.errors.caption && (
                          <p className="text-sm text-red-500 mt-1">
                            {postForm.formState.errors.caption.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-neutral-500" />
                        <Input
                          placeholder="Add location"
                          {...postForm.register("location")}
                        />
                      </div>
                      
                      <div className="flex items-center text-neutral-500">
                        <Users className="h-5 w-5 mr-2" />
                        <span>Tag People</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* REEL CREATION */}
            <TabsContent value="reel">
              {!videoPreview ? (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 p-8 text-center">
                  <Film className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                  <h2 className="text-xl font-semibold mb-2">Create a Reel</h2>
                  <p className="text-neutral-500 mb-6">Share videos with your followers</p>
                  
                  <input 
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <div className="inline-flex cursor-pointer">
                      <Button className="pointer-events-none">
                        <Film className="h-4 w-4 mr-2" />
                        Select Video
                      </Button>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700">
                  <div className="border-b border-neutral-300 dark:border-neutral-700 p-4 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <h2 className="text-lg font-semibold">Create Reel</h2>
                    <Button 
                      size="sm" 
                      onClick={reelForm.handleSubmit(onReelSubmit)}
                      disabled={isUploading || createReelMutation.isPending}
                    >
                      Share
                    </Button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 bg-black flex items-center justify-center p-2">
                      <video 
                        src={videoPreview} 
                        controls
                        className="max-w-full max-h-[50vh] md:max-h-[70vh]"
                      />
                    </div>
                    
                    <div className="md:w-1/2 p-4">
                      <div className="mb-4">
                        <Textarea
                          placeholder="Write a caption..."
                          className="resize-none"
                          {...reelForm.register("caption")}
                        />
                        {reelForm.formState.errors.caption && (
                          <p className="text-sm text-red-500 mt-1">
                            {reelForm.formState.errors.caption.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Add a thumbnail (optional)</p>
                        
                        {!thumbnailPreview ? (
                          <>
                            <input 
                              type="file"
                              ref={thumbnailInputRef}
                              accept="image/*"
                              onChange={handleThumbnailChange}
                              className="hidden"
                              id="thumbnail-upload"
                            />
                            <label htmlFor="thumbnail-upload">
                              <div className="inline-flex cursor-pointer">
                                <Button variant="outline" size="sm" className="pointer-events-none">
                                  <Image className="h-4 w-4 mr-2" />
                                  Select Thumbnail
                                </Button>
                              </div>
                            </label>
                          </>
                        ) : (
                          <div className="relative inline-block">
                            <img 
                              src={thumbnailPreview} 
                              alt="Thumbnail" 
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => setThumbnailPreview(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium block mb-2">
                          Duration (seconds)
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter video duration in seconds (optional)"
                          {...reelForm.register("duration")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}