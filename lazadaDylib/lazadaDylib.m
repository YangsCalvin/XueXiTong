//  weibo: http://weibo.com/xiaoqing28
//  blog:  http://www.alonemonkey.com
//
//  lazadaDylib.m
//  lazadaDylib
//
//  Created by apple on 2018/2/26.
//  Copyright (c) 2018年 MonkeyApp. All rights reserved.
//

#import "lazadaDylib.h"
#import <CaptainHook/CaptainHook.h>
#import <UIKit/UIKit.h>
#import <Cycript/Cycript.h>
#import "tools.h"
#import "MPMoviePlayeControllerNew.h"
static __attribute__((constructor)) void entry(){
    NSLog(@"\n               🎉!!！congratulations!!！🎉\n👍----------------insert dylib success----------------👍");
    
    [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidFinishLaunchingNotification object:nil queue:[NSOperationQueue mainQueue] usingBlock:^(NSNotification * _Nonnull note) {
        
        CYListenServer(6666);
    }];
}

@interface CustomViewController

-(NSString*)getMyName;

@end

CHDeclareClass(CustomViewController)

CHOptimizedMethod(0, self, NSString*, CustomViewController,getMyName){
    //get origin value
    NSString* originName = CHSuper(0, CustomViewController, getMyName);
    
    NSLog(@"origin name is:%@",originName);
    
    //get property
    NSString* password = CHIvar(self,_password,__strong NSString*);
    
    NSLog(@"password is %@",password);
    
    //change the value
    return @"AloneMonkey";
    
    
}


CHConstructor{
    CHLoadLateClass(CustomViewController);
    CHClassHook(0, CustomViewController, getMyName);
}



@interface MoviePlayerViewController : NSObject

@property(nonatomic,assign) long long havePlayTime;

@property(nonatomic,assign) long long currentMoviePlayTime;


- (void)MyMovieDurationCallback:(id)arg1;


@end

CHDeclareClass(MoviePlayerViewController)

CHOptimizedMethod(1, self,void,MoviePlayerViewController,MyMovieDurationCallback,id,arg1){
    [self setValue:@10000 forKey:@"havePlayTime"];
    [self setValue:@10000 forKey:@"currentMoviePlayTime"];
    CHSuper(1, MoviePlayerViewController,MyMovieDurationCallback,arg1);
}

CHConstructor{
    CHLoadLateClass(MoviePlayerViewController);
    CHClassHook(1, MoviePlayerViewController,MyMovieDurationCallback);
}


