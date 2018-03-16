//
//  tools.m
//  lazadaDylib
//
//  Created by apple on 2018/3/7.
//  Copyright © 2018年 MonkeyApp. All rights reserved.
//

#import "tools.h"

@implementation tools
+ (instancetype)shared{
    
    static tools *to;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        
        to = [self new];
    });
    
    return to;
}
@end
