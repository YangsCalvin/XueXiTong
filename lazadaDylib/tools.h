//
//  tools.h
//  lazadaDylib
//
//  Created by apple on 2018/3/7.
//  Copyright © 2018年 MonkeyApp. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface tools : NSObject

+ (instancetype)shared;

@property(nonatomic,assign)NSUInteger index;
@end
