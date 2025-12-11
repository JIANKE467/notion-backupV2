# 实验1（点亮LED）

1. 打开keil→project→new uvision project（新建项目文件）→选择MCU型号→project中选择target1→右键source group1→add new….
1. 代码
```c
#include <REGX52.H>
void main ()
{
  p2=0xFE//11111110;
}
```

### 原理

查看原理图，看要点亮的LED与那个寄存器相连，修改寄存器内的值以改变LED亮灭状态

解释：

<REGX52.H>是定义stc89c52单片机寄存器的头文件

注意⚠️：

1. 如果LED是共阳接法，寄存器的值与实际亮灭状态是相反的
1. 给寄存器赋值要用16进制，不能直接用二进制，否则会被当成10进制处理


PS：手头的开发板不仅是共阳接法，寄存器标号也标反了😅😅😅

keil默认不生成hex文件，需要点这个

![image](./../assets/img_26d5a2dd-8276-80fc-91a4-e01c7e929c46.jpg)

在output中勾选create hex file后点击OK

# 实验二（让程序持续运行）

在最外层写一个死循环阻止程序退出

```c
#include <REGX52.H>
void main ()
{ 
 while(1)
  {
    p2=0xFE//11111110;
  }
}
```



