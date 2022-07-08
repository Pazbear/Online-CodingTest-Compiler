print("[valid data]")
problems = [[1,2,3,4],[1,2,7,6,4]]
answers = [1,4]
right_cnt=0
for i in range(len(problems)):
    if solution(problems[i])==answers[i]:
        right_cnt+=1
    print("success:",right_cnt, "/failed:",len(problems)-right_cnt)