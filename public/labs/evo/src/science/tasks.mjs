export const TASKS=[
 {id:'resource',title:'资源变少之后',question:'植物再生减半后，你预测种群、出生和资源存量各怎样变化？',variable:'regeneration',apply:c=>({...c,regeneration:c.regeneration/2}),observe:['population','births','food','sunlight'],next:'初始资源能让影响延迟多久？'},
 {id:'mutation',title:'同祖先，不同后代',question:'把突变概率改为0.2，你预测亲子性状和权重会怎样不同？',variable:'mutationRate',apply:c=>({...c,mutationRate:.2,reproduction:true,padControllerBudget:false}),observe:['generation','traitDiversity','births'],next:'更多变体是否一定有更好的繁殖表现？'},
 {id:'communication',title:'没有消息的搜索',question:'关闭通信后，你预测觅食和合作效率会变化吗？',variable:'communication',apply:c=>({...c,communication:'none'}),observe:['messagesDelivered','cooperativeHarvest','eaten'],next:'怎样区分消息带来的帮助与资源吸引导致的聚集？'},
 {id:'controller',title:'两种决策方式',question:'相同初始条件下，规则与当前神经网络哪一种更适合这个世界？为什么？',variable:'controller',apply:c=>({...c,controller:'neural'}),observe:['population','meanEnergy','births'],next:'随机和启发式初始化是否应分开比较？计算预算怎样匹配？'},
 {id:'ancestor',title:'追踪一个家族',question:'选择一个祖先，你预测它的子代会保留哪些特征？',variable:'mutationRate',apply:c=>({...c,reproduction:true,padControllerBudget:false}),observe:['generation','births'],next:'哪些性状相同来自遗传，哪些行为差异来自位置和资源？'}
];
