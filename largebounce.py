import magphyxp
import numpy as np
VARY_PTHETA_PPHI = 0
VARY_PTHETA_ENERGY = 1

f = open("/home/bojohnson/Desktop/data1.txt","w")
# f.write("BifID\tNumBounce\tPeriod\t(E+1/3)n**2\tRNum\tInPhase?\n")
f.write('{:<5}{:^13}{:^13}{:^13} {:^5} {:^7}\n'.format("BifID","NumBounce",
"Period","(E+1/3)n**2","RNum","InPhase?"))
# unique = []
# for num_bounces in range(10,101,5):
for num_bounces in [8]:
    # f.write('Bounces: {}\n'.format(num_bounces))
    E = -1/3
    previous_e = -1/3
    previous_t = 0
    h = 1e-7
    count = 0
    while (E <= 0 and count < 30):
        # print('Energy: {:e}, f: {:e}'.format(E, m.f))
        m = magphyxp.calculate_min(1e-9, 1e-9, num_bounces, E, 1e-7,
        VARY_PTHETA_ENERGY, 1e-7)
        # row = np.array([num_bounces,np.sqrt(abs(2*m.energy + 2/3 - m.ptheta**2 - 10*m.pphi**2)),m.ptheta,m.pphi,m.energy,m.t])
        # print('Energy: {:e}, f: {:e}'.format(E, m.f))
        if (m.f < 1e-9 and m.energy > -1/3 and m.energy - previous_e > h
        and m.t > 0.0 and m.t - previous_t > 1):
        # if m.f < 1e-9 and m.energy > -1/3:
            # unique.append(np.array((row[0],row[4]+1/3,2*np.pi/row[5])))
			# f.write('{} {} {}\n'.format(num_bounces,(E+1/3)*num_bounces**2,m.t))
            # f.write('Start E: {} pr: {} ptheta: {} pphi: {}\n'.format(E,np.sqrt(abs(2*m.energy + 2/3 - m.ptheta**2 - 10*m.pphi**2)),m.ptheta,m.pphi,m.energy,m.f,m.t))
            f.write('{:<5}{:^13}{:>13.6f}{:>13.6f} {:^5} {:^7}\n'.format(count,
            num_bounces,m.t,(m.energy+1/3)*num_bounces**2,m.rocking_number/2,
            m.rocking_in_phase))
            # print('Start E: {} ptheta: {} pphi: {} energy: {} fval: {} time: {}\n'.format(E,m.ptheta,m.pphi,m.energy,m.f,m.t))
            # f.flush()
            count += 1
            previous_t = m.t
            # break
        h = h*1.1
        E = E+h
        previous_e = m.energy

f.close()
