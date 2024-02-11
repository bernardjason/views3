/* eslint-disable import/no-extraneous-dependencies */


import { Construct } from 'constructs';


import { aws_ssm as ssm } from 'aws-cdk-lib';

export class PatchManager extends Construct {
    constructor(scope: Construct, id: string) {
        super(scope, id);


  
        const maintenanceWindow = new ssm.CfnMaintenanceWindow(this, 'maintenanceWindow', {
              name: 'views3-patch-window',                             
              allowUnassociatedTargets:false,
              cutoff:1,
              duration:2,              
              schedule:'cron(0 5 * * ? *)', 
              tags: [ { key:"views3",value:"true"} ]
            }                        
        )
        
        
        const targets = new ssm.CfnMaintenanceWindowTarget(this,"patchTargets",{
          resourceType:'INSTANCE',
          targets:[
            {key:"tag:views3",values:["true"]}
          ],
          windowId:maintenanceWindow.ref,                                    
        });

        new ssm.CfnMaintenanceWindowTask(this,"patchTask",{
          taskArn: "AWS-RunPatchBaseline",
          priority:1,
          taskType:"RUN_COMMAND",
          windowId:maintenanceWindow.ref,
          name:"viewS3-AWS-RunPatchBaseline",
          
          maxConcurrency:"1",
          maxErrors:"1",         
          taskInvocationParameters:{
            maintenanceWindowRunCommandParameters:{
              parameters:{
                Operation: ["Install"],
              },
              cloudWatchOutputConfig:{
                cloudWatchOutputEnabled:true,
                cloudWatchLogGroupName:"views3Patching"
              }
            }
          },                  
          targets:[
            {"key":"WindowTargetIds", "values":[targets.ref]}
          ]
          }
          
        )
 
            

        
    };






    
}